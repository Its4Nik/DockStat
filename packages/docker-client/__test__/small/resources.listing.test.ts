import { expect, test } from "bun:test"
import Logger from "@dockstat/logger"
import DB from "@dockstat/sqlite-wrapper"
import type PluginHandler from "@dockstat/plugin-handler"
import DCM from "../../src/manager/index"

const DOCKER_HOST = "127.0.0.1"
const DOCKER_PORT = 2375

test("resources: list images, networks, and volumes", async () => {
  // Inline setup
  const logger = new Logger("DCM:resources:listing")
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

  let clientId = -1
  let hostId = -1

  try {
    // Create a client without monitoring (not needed for resource listings)
    const reg = await dcm.registerClient("small-resources-client", { enableMonitoring: false })
    expect(reg.success).toBe(true)
    clientId = Number(reg.clientId ?? -1)
    expect(clientId).toBeGreaterThan(0)

    // Add host and initialize worker
    const host = await dcm.addHost(clientId, DOCKER_HOST, "resources-local", false, DOCKER_PORT)
    hostId = Number(host.id)
    expect(hostId).toBeGreaterThan(0)

    await dcm.init(clientId)

    // Images
    const images = await dcm.getImages(clientId, hostId)
    expect(Array.isArray(images)).toBe(true)

    // Networks
    const networks = await dcm.getNetworks(clientId, hostId)
    expect(Array.isArray(networks)).toBe(true)

    // Volumes
    const volumes = await dcm.getVolumes(clientId, hostId)
    expect(Array.isArray(volumes)).toBe(true)
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
