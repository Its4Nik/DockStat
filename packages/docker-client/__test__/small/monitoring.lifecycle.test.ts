import { expect, test } from "bun:test"
import Logger from "@dockstat/logger"
import type PluginHandler from "@dockstat/plugin-handler"
import DB from "@dockstat/sqlite-wrapper"
import DCM from "../../src/manager/index"

const DOCKER_HOST = "127.0.0.1"
const DOCKER_PORT = 2375

test("monitoring: create manager, start/stop, and basic data paths", async () => {
  // Arrange: minimal infra and a stub plugin handler
  const logger = new Logger("DCM:monitoring:lifecycle")
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
    // Create a client with monitoring disabled so we can exercise createMonitoringManager()
    const reg = await dcm.registerClient("small-monitoring-client", {
      enableMonitoring: false,
      monitoringOptions: {
        // Keep host metrics enabled for getHostMetrics calls (manager methods don't rely on the interval)
        enableHostMetrics: true,
        hostMetricsInterval: 10000,
      },
    })
    expect(reg.success).toBe(true)
    clientId = Number(reg.clientId ?? -1)
    expect(clientId).toBeGreaterThan(0)

    // Add a Docker host (tcp://127.0.0.1:2375) and init the worker
    const host = await dcm.addHost(clientId, DOCKER_HOST, "mon-local", false, DOCKER_PORT)
    hostId = Number(host.id)
    expect(hostId).toBeGreaterThan(0)

    await dcm.init(clientId)

    // Ensure monitoring manager doesn't exist yet
    expect(await dcm.hasMonitoringManager(clientId)).toBe(false)

    // Create + start monitoring
    await dcm.createMonitoringManager(clientId)
    expect(await dcm.hasMonitoringManager(clientId)).toBe(true)

    await dcm.startMonitoring(clientId)
    expect(await dcm.isMonitoring(clientId)).toBe(true)

    // Basic data paths (synchronous queries via the manager)
    const hm = await dcm.getHostMetrics(clientId, hostId)
    expect(hm.hostId).toBe(hostId)
    expect(typeof hm.hostName).toBe("string")

    const allHm = await dcm.getAllHostMetrics(clientId)
    expect(Array.isArray(allHm)).toBe(true)
    expect(allHm.some((m) => m.hostId === hostId)).toBe(true)

    const healthy = await dcm.checkHostHealth(clientId, hostId)
    expect(healthy).toBe(true)

    const healthMap = await dcm.checkAllHostsHealth(clientId)
    expect(healthMap[hostId]).toBe(true)

    const stats = (await dcm.getAllStats(clientId)) as unknown as { hostMetrics?: unknown[] }
    expect(Array.isArray(stats.hostMetrics)).toBe(true)

    // Stop monitoring
    await dcm.stopMonitoring(clientId)
    expect(await dcm.isMonitoring(clientId)).toBe(false)
  } finally {
    // Cleanup
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
