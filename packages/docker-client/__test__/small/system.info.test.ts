import { expect, test } from "bun:test"
import Logger from "@dockstat/logger"
import type PluginHandler from "@dockstat/plugin-handler"
import DB from "@dockstat/sqlite-wrapper"
import type { DOCKER } from "@dockstat/typings"
import DCM from "../../src/manager/index"

const DOCKER_HOST = "127.0.0.1"
const DOCKER_PORT = 2375

test("system: info, version, df, prune", async () => {
  // Arrange: minimal infra and a stub plugin handler
  const logger = new Logger("DCM:system:info")
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
    // Create client (no monitoring required for system queries)
    const reg = await dcm.registerClient("small-system-client", { enableMonitoring: false })
    expect(reg.success).toBe(true)
    clientId = Number(reg.clientId ?? -1)
    expect(clientId).toBeGreaterThan(0)

    // Add a Docker host (tcp://127.0.0.1:2375) and init the worker
    const host = await dcm.addHost(clientId, DOCKER_HOST, "sys-local", false, DOCKER_PORT)
    hostId = Number(host.id)
    expect(hostId).toBeGreaterThan(0)

    await dcm.init(clientId)

    // Version
    const version = (await dcm.getSystemVersion(
      clientId,
      hostId
    )) as DOCKER.DockerAPIResponse["dockerVersion"]
    expect(typeof version.ApiVersion).toBe("string")
    expect(version.ApiVersion.length).toBeGreaterThan(0)

    // Info
    const info = (await dcm.getSystemInfo(
      clientId,
      hostId
    )) as DOCKER.DockerAPIResponse["systemInfo"]
    expect(typeof info.OperatingSystem).toBe("string")
    expect(info.NCPU).toBeGreaterThan(0)

    // Disk usage (df)
    const df = (await dcm.getDiskUsage(clientId, hostId)) as DOCKER.DockerAPIResponse["diskUsage"]
    expect(typeof df).toBe("object")

    // Prune (non-destructive; returns reclaimed bytes)
    const pruned = (await dcm.pruneSystem(clientId, hostId)) as { SpaceReclaimed: number }
    expect(typeof pruned.SpaceReclaimed).toBe("number")
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
