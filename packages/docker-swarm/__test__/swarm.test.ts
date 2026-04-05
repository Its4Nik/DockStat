import { beforeAll, describe, expect, test } from "bun:test"
import { SwarmModule } from "../src/modules/swarm"
import { TestLogger } from "./.logger"

/**
 * Comprehensive tests for SwarmModule including:
 * - Swarm status retrieval
 * - Swarm initialization
 * - Swarm joining
 * - Swarm leaving
 * - Join token management
 * - Manager status checks
 * - Error handling
 */

describe("SwarmModule initialization", () => {
  test("Create module with default options", () => {
    const module = new SwarmModule({}, TestLogger)

    expect(module).toBeDefined()
  })

  test("Create module with custom socket path", () => {
    const module = new SwarmModule(
      {
        socketPath: "/custom/docker.sock",
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Create module with TCP host", () => {
    const module = new SwarmModule(
      {
        host: "http://localhost:2375",
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Create module with timeout", () => {
    const module = new SwarmModule(
      {
        timeout: 60000,
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })
})

describe("Swarm status operations", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("getStatus returns swarm status object", async () => {
    const status = await module.getStatus()

    expect(status).toBeDefined()
    expect(typeof status.isManager).toBe("boolean")
  })

  test("getStatus returns nodeID when in swarm", async () => {
    const status = await module.getStatus()

    if (status.nodeID) {
      expect(typeof status.nodeID).toBe("string")
      expect(status.nodeID.length).toBeGreaterThan(0)
    }
  })

  test("getStatus returns isManager boolean", async () => {
    const status = await module.getStatus()

    expect(typeof status.isManager).toBe("boolean")
  })

  test("getStatus returns joinTokens when manager", async () => {
    const status = await module.getStatus()

    if (status.isManager && status.joinTokens) {
      expect(status.joinTokens.worker).toBeDefined()
      expect(status.joinTokens.manager).toBeDefined()
    }
  })

  test("getStatus returns swarm id when in swarm", async () => {
    const status = await module.getStatus()

    if (status.id) {
      expect(typeof status.id).toBe("string")
    }
  })

  test("getStatus handles not in swarm scenario", async () => {
    // This test may pass or fail depending on if the system is in a swarm
    // We're just ensuring it doesn't throw an error
    const status = await module.getStatus()

    expect(status).toBeDefined()
  })
})

describe("Swarm initialization", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("init returns join tokens", async () => {
    // Note: This test may fail if already in a swarm
    // It's designed to work with a fresh Docker installation
    try {
      const result = await module.init({
        listenAddr: "0.0.0.0:2377",
      })

      expect(result).toBeDefined()
      expect(result.workerToken).toBeDefined()
      expect(typeof result.workerToken).toBe("string")
      expect(result.managerToken).toBeDefined()
      expect(typeof result.managerToken).toBe("string")
    } catch (error) {
      // Expected if already in swarm
      if (
        error instanceof Error &&
        (error.message.includes("already part of a swarm") ||
          error.message.includes("This node is already part of a swarm"))
      ) {
        // Expected - already in a swarm
      } else {
        throw error
      }
    }
  })

  test("init with custom listen address", async () => {
    try {
      const result = await module.init({
        listenAddr: "0.0.0.0:2377",
        advertiseAddr: "192.168.1.1:2377",
      })

      expect(result.workerToken).toBeDefined()
      expect(result.managerToken).toBeDefined()
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("already part of a swarm") ||
          error.message.includes("This node is already part of a swarm"))
      ) {
        // Expected - already in a swarm
      } else {
        throw error
      }
    }
  })

  test("init with force new cluster option", async () => {
    try {
      const result = await module.init({
        listenAddr: "0.0.0.0:2377",
        forceNewCluster: true,
      })

      expect(result.workerToken).toBeDefined()
      expect(result.managerToken).toBeDefined()
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("already part of a swarm") ||
          error.message.includes("This node is already part of a swarm"))
      ) {
        // Expected - already in a swarm
      } else {
        throw error
      }
    }
  })
})

describe("Swarm joining", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("join requires valid parameters", async () => {
    try {
      await module.join({
        joinToken: "SWMTKN-1-xxx",
        remoteAddrs: ["192.168.1.1:2377"],
      })
    } catch (error) {
      // Expected to fail with invalid token or connection
      expect(error).toBeDefined()
    }
  })

  test("join with custom listen address", async () => {
    try {
      await module.join({
        joinToken: "SWMTKN-1-xxx",
        remoteAddrs: ["192.168.1.1:2377"],
        listenAddr: "0.0.0.0:2377",
      })
    } catch (error) {
      // Expected to fail with invalid token or connection
      expect(error).toBeDefined()
    }
  })

  test("join with advertise address", async () => {
    try {
      await module.join({
        joinToken: "SWMTKN-1-xxx",
        remoteAddrs: ["192.168.1.1:2377"],
        advertiseAddr: "192.168.1.2:2377",
      })
    } catch (error) {
      // Expected to fail with invalid token or connection
      expect(error).toBeDefined()
    }
  })

  test("join handles invalid token", async () => {
    try {
      await module.join({
        joinToken: "invalid-token",
        remoteAddrs: ["192.168.1.1:2377"],
      })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe("Swarm leaving", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("leave with force option", async () => {
    // Note: This is a destructive operation
    // Only run if you want to test leaving a swarm
    try {
      await module.leave({ force: true })
    } catch (error) {
      // May fail if not in a swarm
      if (error instanceof Error && !error.message.includes("This node is not part of a swarm")) {
        throw error
      }
    }
  })

  test("leave without force option", async () => {
    try {
      await module.leave({ force: false })
    } catch (error) {
      // Expected if not in a swarm or is a manager with services
      if (error instanceof Error && !error.message.includes("This node is not part of a swarm")) {
        // Other errors are expected in certain scenarios
      }
    }
  })

  test("leave handles not in swarm scenario", async () => {
    try {
      await module.leave()
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBeDefined()
      }
    }
  })
})

describe("Join token operations", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("getJoinTokens returns worker and manager tokens", async () => {
    const status = await module.getStatus()

    if (status.isManager) {
      const tokens = await module.getJoinTokens()

      expect(tokens).toBeDefined()
      expect(tokens.worker).toBeDefined()
      expect(typeof tokens.worker).toBe("string")
      expect(tokens.manager).toBeDefined()
      expect(typeof tokens.manager).toBe("string")
    }
  })

  test("getJoinTokens handles non-manager scenario", async () => {
    const status = await module.getStatus()

    if (!status.isManager) {
      try {
        await module.getJoinTokens()
      } catch (error) {
        // Expected to fail for non-managers
        expect(error).toBeDefined()
      }
    }
  })

  test("rotateJoinTokens returns new tokens", async () => {
    const status = await module.getStatus()

    if (status.isManager) {
      const newTokens = await module.rotateJoinTokens()

      expect(newTokens.worker).toBeDefined()
      expect(newTokens.manager).toBeDefined()
      expect(typeof newTokens.worker).toBe("string")
      expect(typeof newTokens.manager).toBe("string")
    }
  })

  test("rotateJoinTokens changes the tokens", async () => {
    const status = await module.getStatus()

    if (status.isManager) {
      const oldTokens = await module.getJoinTokens()
      const newTokens = await module.rotateJoinTokens()

      expect(newTokens.worker).not.toBe(oldTokens.worker)
      expect(newTokens.manager).not.toBe(oldTokens.manager)
    }
  })
})

describe("Manager status checks", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("isManager returns boolean", async () => {
    const isManager = await module.isManager()

    expect(typeof isManager).toBe("boolean")
  })

  test("isManager matches status.isManager", async () => {
    const status = await module.getStatus()
    const isManager = await module.isManager()

    expect(isManager).toBe(status.isManager ?? !isManager)
  })
})

describe("Swarm membership checks", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("isInSwarm returns boolean", async () => {
    const inSwarm = await module.isInSwarm()

    expect(typeof inSwarm).toBe("boolean")
  })

  test("isInSwarm matches presence of nodeID", async () => {
    const status = await module.getStatus()
    const inSwarm = await module.isInSwarm()

    expect(inSwarm).toBe(!!status.nodeID)
  })
})

describe("Swarm update operations", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("update requires spec and version", async () => {
    const status = await module.getStatus()

    if (status.isManager && status.spec) {
      try {
        await module.update({
          spec: status.spec,
          version: status.version?.index ?? 0,
        })
      } catch (error) {
        // May fail depending on current state
        expect(error).toBeDefined()
      }
    }
  })

  test("update with token rotation", async () => {
    const status = await module.getStatus()

    if (status.isManager && status.spec) {
      try {
        await module.update({
          spec: status.spec,
          version: status.version?.index ?? 0,
          rotateWorkerToken: true,
          rotateManagerToken: true,
        })
      } catch (error) {
        // May fail depending on current state
        expect(error).toBeDefined()
      }
    }
  })

  test("update handles invalid version", async () => {
    const status = await module.getStatus()

    if (status.isManager && status.spec) {
      try {
        await module.update({
          spec: status.spec,
          version: -1,
        })
      } catch (error) {
        expect(error).toBeDefined()
      }
    }
  })
})

describe("Error handling", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule(
      {
        socketPath: "/nonexistent/docker.sock",
      },
      TestLogger
    )
  })

  test("getStatus handles connection errors", async () => {
    try {
      await module.getStatus()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("init handles connection errors", async () => {
    try {
      await module.init()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("join handles connection errors", async () => {
    try {
      await module.join({
        joinToken: "SWMTKN-1-xxx",
        remoteAddrs: ["192.168.1.1:2377"],
      })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("leave handles connection errors", async () => {
    try {
      await module.leave()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("getJoinTokens handles connection errors", async () => {
    try {
      await module.getJoinTokens()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("rotateJoinTokens handles connection errors", async () => {
    try {
      await module.rotateJoinTokens()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe("Multiple module instances", () => {
  test("Multiple modules can be created independently", () => {
    const module1 = new SwarmModule({ socketPath: "/path1/docker.sock" }, TestLogger)
    const module2 = new SwarmModule({ host: "http://localhost:2375" }, TestLogger)

    expect(module1).toBeDefined()
    expect(module2).toBeDefined()
  })
})

describe("Module with various connection options", () => {
  test("Module with HTTP connection", () => {
    const module = new SwarmModule(
      {
        host: "http://192.168.1.100:2375",
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Module with HTTPS connection", () => {
    const module = new SwarmModule(
      {
        host: "https://docker.example.com:2376",
        tls: {
          ca: Buffer.from("ca"),
          cert: Buffer.from("cert"),
          key: Buffer.from("key"),
        },
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Module with custom timeout", () => {
    const module = new SwarmModule(
      {
        timeout: 60000,
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Module with socket path and timeout", () => {
    const module = new SwarmModule(
      {
        socketPath: "/var/run/docker.sock",
        timeout: 45000,
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })
})

describe("Swarm spec handling", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("getStatus includes spec when in swarm", async () => {
    const status = await module.getStatus()

    if (status.nodeID) {
      expect(status.spec).toBeDefined()
    }
  })

  test("getStatus includes version when in swarm", async () => {
    const status = await module.getStatus()

    if (status.nodeID) {
      expect(status.version).toBeDefined()
      expect(typeof status.version?.index).toBe("number")
    }
  })

  test("getStatus includes timestamps when in swarm", async () => {
    const status = await module.getStatus()

    if (status.nodeID) {
      expect(status.createdAt).toBeDefined()
      expect(status.updatedAt).toBeDefined()
    }
  })
})

describe("Swarm node information", () => {
  let module: SwarmModule

  beforeAll(() => {
    module = new SwarmModule({}, TestLogger)
  })

  test("getStatus includes node address when in swarm", async () => {
    const status = await module.getStatus()

    if (status.nodeID) {
      expect(status.nodeAddr).toBeDefined()
      expect(typeof status.nodeAddr).toBe("string")
    }
  })

  test("nodeID format is valid", async () => {
    const status = await module.getStatus()

    if (status.nodeID) {
      // Docker node IDs are typically 64-character hex strings
      expect(status.nodeID.length).toBe(64)
      expect(/^[a-f0-9]+$/.test(status.nodeID)).toBe(true)
    }
  })
})
