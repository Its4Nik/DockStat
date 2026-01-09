import { expect, test } from "bun:test"
import Logger from "@dockstat/logger"
import DB from "@dockstat/sqlite-wrapper"
import type PluginHandler from "@dockstat/plugin-handler"
import DCM from "../../src/manager/index"

test("core: register client and list clients (live and stored)", async () => {
  // Arrange: minimal infra and a stub plugin handler
  const logger = new Logger("DCM:core:register")
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

  try {
    // Act: register a client
    const reg = await dcm.registerClient("small-core-client", {
      enableMonitoring: false,
    })

    // Assert: success + a valid client id
    expect(reg.success).toBe(true)
    const clientId = Number(reg.clientId ?? -1)
    expect(clientId).toBeGreaterThan(0)

    // Live clients should include the new client and be initialized
    const live = dcm.getAllClients(false)
    const liveEntry = live.find((c) => c.id === clientId)
    expect(liveEntry).toBeTruthy()
    expect(liveEntry?.initialized).toBe(true)
    expect(liveEntry?.name).toBe("small-core-client")

    // Stored (persisted) clients should also include it
    const stored = dcm.getAllClients(true)
    const storedEntry = stored.find((c) => c.id === clientId)
    expect(storedEntry).toBeTruthy()
    expect(storedEntry?.name).toBe("small-core-client")

    // getClient should return the worker wrapper of our client
    const wrapper = dcm.getClient(clientId)
    expect(wrapper?.clientId).toBe(clientId)
    expect(wrapper?.initialized).toBe(true)
  } finally {
    // Cleanup
    try {
      await dcm.dispose()
    } catch {
      // ignore
    }
    db.close()
  }
})
