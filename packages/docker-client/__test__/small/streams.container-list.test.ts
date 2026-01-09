import { expect, test } from "bun:test"
import Logger from "@dockstat/logger"
import DB from "@dockstat/sqlite-wrapper"
import type PluginHandler from "@dockstat/plugin-handler"
import DCM from "../../src/manager/index"

const DOCKER_HOST = "127.0.0.1"
const DOCKER_PORT = 2375
const CLIENT_NAME = "small-streams-client"
const CONNECTION_ID = "streams-container-list"

test("streams: container_list subscribe → event → unsubscribe", async () => {
  // Inline setup
  const logger = new Logger("DCM:streams:container_list")
  const db = new DB(":memory:")

  // Minimal plugin handler stub to satisfy manager requirements
  class TestPluginHandlerStub {
    getHookHandlers() {
      return new Map<number, Partial<Record<string, unknown>>>()
    }
    getServerHooks(_pluginId: number) {
      return {}
    }
  }
  const pluginHandler = new (TestPluginHandlerStub as unknown as { new (): PluginHandler })()

  const dcm = new DCM(db, pluginHandler, logger, { maxWorkers: 1 })

  // Helper to wait for a single proxied stream event for this connection/channel
  const waitForStreamEvent = (
    worker: Worker,
    channel: string,
    timeoutMs = 25000
  ): Promise<{ message: { type: string; channel: string; data: unknown } }> =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        worker.removeEventListener("message", listener)
        reject(new Error(`Timed out waiting for ${channel} event`))
      }, timeoutMs)

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
          if (ctx?.connectionId === CONNECTION_ID && ctx?.message?.channel === channel) {
            clearTimeout(timeout)
            worker.removeEventListener("message", listener)
            resolve({ message: ctx.message as { type: string; channel: string; data: unknown } })
          }
        }
      }

      worker.addEventListener("message", listener)
    })

  let clientId = -1
  let hostId = -1

  try {
    // 1) Register a client (monitoring not required for container_list)
    const reg = await dcm.registerClient(CLIENT_NAME, { enableMonitoring: false })
    expect(reg.success).toBe(true)
    clientId = Number(reg.clientId ?? -1)
    expect(clientId).toBeGreaterThan(0)

    // 2) Add host and init worker
    const host = await dcm.addHost(clientId, DOCKER_HOST, "streams-local", false, DOCKER_PORT)
    hostId = Number(host.id)
    expect(hostId).toBeGreaterThan(0)
    await dcm.init(clientId)

    // 3) Create stream connection
    await dcm.createConnection(clientId, CONNECTION_ID)

    // 4) Hook worker messages to capture proxied stream payloads
    const wrapper = dcm.getClient(clientId)
    if (!wrapper) throw new Error("No worker wrapper found for client")
    const worker = wrapper.worker

    const nextContainerList = waitForStreamEvent(worker, "container_list", 25000)

    // 5) Subscribe to container_list (global, no host filter) with a short interval
    const subscriptionId = await dcm.subscribe(clientId, CONNECTION_ID, "container_list", {
      interval: 1000,
    })
    expect(typeof subscriptionId).toBe("string")

    // 6) Validate first event payload
    const { message } = await nextContainerList
    expect(message.type).toBe("data")
    expect(message.channel).toBe("container_list")
    const listData = message.data as unknown[]
    expect(Array.isArray(listData)).toBe(true)

    // 7) Verify subscription shows up via manager API and then unsubscribe
    const subs = await dcm.getSubscriptions(clientId, CONNECTION_ID)
    expect(subs.some((s) => s.id === subscriptionId && s.channel === "container_list")).toBe(true)

    const ok = await dcm.unsubscribe(clientId, subscriptionId)
    expect(ok).toBe(true)

    // 8) Close the connection
    await dcm.closeConnection(clientId, CONNECTION_ID)
  } finally {
    // Best-effort cleanup
    try {
      if (clientId > 0 && hostId > 0) {
        await dcm.removeHost(clientId, hostId)
      }
    } catch {
      // ignore
    }
    try {
      await dcm.dispose()
    } catch {
      // ignore
    }
    db.close()
  }
})
