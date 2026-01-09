import { expect, test } from "bun:test"
import Logger from "@dockstat/logger"
import DB from "@dockstat/sqlite-wrapper"
import type PluginHandler from "@dockstat/plugin-handler"
import DCM from "../src/manager/index"

const DOCKER_HOST = "127.0.0.1"
const DOCKER_PORT = 2375
const CLIENT_NAME = "e2e-client"
const CONNECTION_ID = "conn-e2e"

test("Streams: host_metrics delivers data via DockerClientManager (no mocks)", async () => {
  const logger = new Logger("E2E")
  const db = new DB(":memory:")

  // Minimal plugin handler stub to satisfy manager expectations
  class TestPluginHandlerStub {
    getHookHandlers() {
      return new Map<number, Partial<Record<string, unknown>>>()
    }
    getServerHooks(_id: number) {
      return {}
    }
  }
  const pluginHandler = new TestPluginHandlerStub() as unknown as PluginHandler

  const dcm = new DCM(db, pluginHandler, logger, { maxWorkers: 1 })

  let clientId = -1
  let hostId = -1

  try {
    // 1) Register a client (MonitoringManager not strictly required for host_metrics stream)
    const reg = await dcm.registerClient(CLIENT_NAME, {
      enableMonitoring: true,
      monitoringOptions: {
        enableHostMetrics: true,
        hostMetricsInterval: 10000,
      },
    })
    expect(reg.success).toBe(true)
    clientId = Number(reg.clientId ?? -1)
    expect(clientId).toBeGreaterThan(0)

    // 2) Add host and init
    const host = await dcm.addHost(clientId, DOCKER_HOST, "local-docker", false, DOCKER_PORT)
    hostId = Number(host.id)
    expect(hostId).toBeGreaterThan(0)

    await dcm.init(clientId)

    // Optional quick reachability check (kept simple, avoids extra assertions)
    const ping = await dcm.ping(clientId)
    expect(ping.reachableInstances).toContain(hostId)

    // 3) Create a logical connection for streaming
    await dcm.createConnection(clientId, CONNECTION_ID)

    // 4) Listen for the proxied message:send event from the worker (StreamManager callback -> proxyEvent)
    const wrapper = dcm.getClient(clientId)
    if (!wrapper) {
      throw new Error("No worker wrapper found for client")
    }
    const worker = wrapper.worker

    const firstHostMetrics = new Promise<{
      message: { type: string; channel: string; data: unknown }
    }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        worker.removeEventListener("message", listener)
        reject(new Error("Timed out waiting for host_metrics event"))
      }, 25_000)

      const listener = (evt: MessageEvent) => {
        const payload = evt.data as
          | {
              type?: string
              data?: {
                type?: string
                ctx?: {
                  connectionId?: string
                  message?: { type?: string; channel?: string; data?: unknown }
                }
              }
            }
          | undefined

        if (payload && payload.type === "__event__" && payload.data?.type === "message:send") {
          const ctx = payload.data.ctx
          if (ctx?.connectionId === CONNECTION_ID && ctx?.message?.channel === "host_metrics") {
            clearTimeout(timeout)
            worker.removeEventListener("message", listener)
            resolve({ message: ctx.message as { type: string; channel: string; data: unknown } })
          }
        }
      }

      worker.addEventListener("message", listener)
    })

    // 5) Subscribe to host_metrics with a short interval
    const subscriptionId = await dcm.subscribe(clientId, CONNECTION_ID, "host_metrics", {
      hostId,
      interval: 1000,
    })
    expect(typeof subscriptionId).toBe("string")

    // 6) Await first payload and validate shape
    const { message } = await firstHostMetrics
    expect(message.type).toBe("data")
    expect(message.channel).toBe("host_metrics")

    const payload = (message.data ?? {}) as { hostId?: number; hostName?: string }
    expect(payload.hostId).toBe(hostId)
    expect(typeof payload.hostName).toBe("string")

    // 7) Cleanup subscription/connection
    const ok = await dcm.unsubscribe(clientId, subscriptionId)
    expect(ok).toBe(true)
    await dcm.closeConnection(clientId, CONNECTION_ID)
  } finally {
    // Best-effort cleanup; dispose may log a warning internally, which is fine for E2E runs
    try {
      await dcm.dispose()
    } catch {
      // ignore
    }
    db.close()
  }
})
