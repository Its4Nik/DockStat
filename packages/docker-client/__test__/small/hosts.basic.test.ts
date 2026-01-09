import { expect, test } from "bun:test"
import Logger from "@dockstat/logger"
import type PluginHandler from "@dockstat/plugin-handler"
import DB from "@dockstat/sqlite-wrapper"
import DCM from "../../src/manager/index"

const DOCKER_HOST = "127.0.0.1"
const DOCKER_PORT = 2375

test("hosts: add, init, ping, getHosts, updateHost", async () => {
  // Arrange: minimal infra and a stub plugin handler
  const logger = new Logger("DCM:hosts:basic")
  const db = new DB(":memory:")

  class TestPluginHandlerStub {
    getHookHandlers() {
      return new Map<number, Partial<Record<string, unknown>>>()
    }
    getServerHooks(_id: number) {
      return {}
    }
  }
  const pluginHandler = new (TestPluginHandlerStub as unknown as { new (): PluginHandler })()

  const dcm = new DCM(db, pluginHandler, logger, { maxWorkers: 1 })

  let clientId = -1
  let hostId = -1

  try {
    // Create a client (monitoring not needed for basic host operations)
    const reg = await dcm.registerClient("small-hosts-client", { enableMonitoring: false })
    expect(reg.success).toBe(true)
    clientId = Number(reg.clientId ?? -1)
    expect(clientId).toBeGreaterThan(0)

    // Add a host (tcp://127.0.0.1:2375) and init the worker
    const host = await dcm.addHost(clientId, DOCKER_HOST, "small-local", false, DOCKER_PORT)
    hostId = Number(host.id)
    expect(hostId).toBeGreaterThan(0)

    await dcm.init(clientId)

    // Ping should mark our host as reachable
    const pingRes = await dcm.ping(clientId)
    expect(Array.isArray(pingRes.reachableInstances)).toBe(true)
    expect(pingRes.reachableInstances).toContain(hostId)

    // getHosts should return the host we added
    const hostsBefore = await dcm.getHosts(clientId)
    const hBefore = hostsBefore.find((h) => Number(h.id) === hostId)
    expect(hBefore).toBeTruthy()
    expect(hBefore?.name).toBe("small-local")

    // Update host (rename) and verify
    const updatedName = "small-local-upd"
    if (!hBefore) throw new Error("Host not found for update")
    const updatedHost = { ...hBefore, name: updatedName }
    await dcm.updateHost(clientId, updatedHost)

    const hostsAfter = await dcm.getHosts(clientId)
    const hAfter = hostsAfter.find((h) => Number(h.id) === hostId)
    expect(hAfter).toBeTruthy()
    expect(hAfter?.name).toBe(updatedName)
  } finally {
    // Best-effort cleanup
    try {
      if (clientId > 0 && hostId > 0) {
        await dcm.removeHost(clientId, hostId)
      }
    } catch {
      // ignore cleanup errors
    }
    try {
      await dcm.dispose()
    } catch {
      // ignore
    }
    db.close()
  }
})
