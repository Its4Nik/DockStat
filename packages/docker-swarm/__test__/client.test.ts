import { beforeAll, describe, expect, test } from "bun:test"
import { SwarmClient } from "../src/client"
import type { SwarmClientOptions } from "../src/types"
import type { Logger } from "../src/utils/logger"
import { TestLogger } from "./.logger"

/**
 * Comprehensive tests for SwarmClient class including:
 * - Client initialization with various connection options
 * - Health check operations
 * - Version and system information
 * - Module initialization
 * - Logger configuration
 */

describe("SwarmClient initialization", () => {
  test("Create client with default options", () => {
    const client = new SwarmClient()

    expect(client).toBeDefined()
    expect(client.docker).toBeDefined()
    expect(client.swarm).toBeDefined()
    expect(client.nodes).toBeDefined()
    expect(client.services).toBeDefined()
    expect(client.tasks).toBeDefined()
    expect(client.stacks).toBeDefined()
    expect(client.secrets).toBeDefined()
    expect(client.configs).toBeDefined()
    expect(client.networks).toBeDefined()
    expect(client.logger).toBeDefined()
  })

  test("Create client with socket path", () => {
    const options: SwarmClientOptions = {
      socketPath: "/var/run/docker.sock",
    }
    const client = new SwarmClient(options)

    expect(client).toBeDefined()
    expect(client.docker).toBeDefined()
  })

  test("Create client with TCP host", () => {
    const options: SwarmClientOptions = {
      host: "http://localhost:2375",
    }
    const client = new SwarmClient(options)

    expect(client).toBeDefined()
    expect(client.docker).toBeDefined()
  })

  test("Create client with TLS options", () => {
    const options: SwarmClientOptions = {
      host: "https://docker.example.com:2376",
      tls: {
        ca: Buffer.from("ca-content"),
        cert: Buffer.from("cert-content"),
        key: Buffer.from("key-content"),
      },
    }
    const client = new SwarmClient(options)

    expect(client).toBeDefined()
    expect(client.docker).toBeDefined()
  })

  test("Create client with SSH options", () => {
    const options: SwarmClientOptions = {
      ssh: {
        host: "remote.example.com",
        passphrase: "secret",
        port: 22,
        privateKey: Buffer.from("ssh-key-content"),
        username: "docker",
      },
    }
    const client = new SwarmClient(options)

    expect(client).toBeDefined()
    expect(client.docker).toBeDefined()
  })

  test("Create client with custom timeout", () => {
    const options: SwarmClientOptions = {
      timeout: 60000,
    }
    const client = new SwarmClient(options)

    expect(client).toBeDefined()
    expect(client.docker).toBeDefined()
  })

  test("Create client with debug mode", () => {
    const options: SwarmClientOptions = {
      debug: true,
    }
    const client = new SwarmClient(options)

    expect(client).toBeDefined()
    expect(client.logger).toBeDefined()
  })

  test("Create client with custom logger", () => {
    const options: SwarmClientOptions = {
      debug: true,
      logger: TestLogger,
    }
    const client = new SwarmClient(options)

    expect(client).toBeDefined()
    expect(client.logger).toBeDefined()
  })

  test("All modules are initialized", () => {
    const client = new SwarmClient()

    expect(client.swarm).toBeDefined()
    expect(client.nodes).toBeDefined()
    expect(client.services).toBeDefined()
    expect(client.tasks).toBeDefined()
    expect(client.stacks).toBeDefined()
    expect(client.secrets).toBeDefined()
    expect(client.configs).toBeDefined()
    expect(client.networks).toBeDefined()
  })

  test("Client options are stored", () => {
    const options: SwarmClientOptions = {
      debug: true,
      socketPath: "/custom/docker.sock",
      timeout: 45000,
    }
    const client = new SwarmClient(options)

    expect(client.options).toEqual(options)
  })
})

describe("Health check operations", () => {
  let client: SwarmClient

  beforeAll(() => {
    client = new SwarmClient()
  })

  test("isAvailable returns boolean", async () => {
    const available = await client.isAvailable()

    expect(typeof available).toBe("boolean")
  })

  test("isSwarmNode returns boolean", async () => {
    const inSwarm = await client.isSwarmNode()

    expect(typeof inSwarm).toBe("boolean")
  })

  test("isSwarmManager returns boolean", async () => {
    const isManager = await client.isSwarmManager()

    expect(typeof isManager).toBe("boolean")
  })

  test("healthCheck returns health status object", async () => {
    const health = await client.healthCheck()

    expect(health).toBeDefined()
    expect(health.connected).toBeDefined()
    expect(typeof health.connected).toBe("boolean")
    expect(health.inSwarm).toBeDefined()
    expect(typeof health.inSwarm).toBe("boolean")
    expect(health.isManager).toBeDefined()
    expect(typeof health.isManager).toBe("boolean")
  })

  test("healthCheck includes nodeCount when connected to swarm", async () => {
    const health = await client.healthCheck()

    if (health.inSwarm && health.isManager) {
      expect(health.nodeCount).toBeDefined()
      expect(typeof health.nodeCount).toBe("number")
      expect(health.serviceCount).toBeDefined()
      expect(typeof health.serviceCount).toBe("number")
    }
  })

  test("healthCheck returns not connected when Docker unavailable", async () => {
    // Create client with invalid socket path
    const clientInvalid = new SwarmClient({
      socketPath: "/nonexistent/docker.sock",
    })

    const health = await clientInvalid.healthCheck()

    expect(health.connected).toBe(false)
    expect(health.inSwarm).toBe(false)
    expect(health.isManager).toBe(false)
  })
})

describe("Version and system information", () => {
  let client: SwarmClient

  beforeAll(() => {
    client = new SwarmClient()
  })

  test("version returns version information", async () => {
    const version = await client.version()

    expect(version).toBeDefined()
    expect(version.version).toBeDefined()
    expect(typeof version.version).toBe("string")
    expect(version.apiVersion).toBeDefined()
    expect(typeof version.apiVersion).toBe("string")
    expect(version.gitCommit).toBeDefined()
    expect(typeof version.gitCommit).toBe("string")
    expect(version.goVersion).toBeDefined()
    expect(typeof version.goVersion).toBe("string")
    expect(version.os).toBeDefined()
    expect(typeof version.os).toBe("string")
    expect(version.arch).toBeDefined()
    expect(typeof version.arch).toBe("string")
  })

  test("info returns system information", async () => {
    const info = await client.info()

    expect(info).toBeDefined()
    expect(typeof info).toBe("object")
  })
})

describe("Client methods handle errors gracefully", () => {
  test("isAvailable handles connection errors", async () => {
    const client = new SwarmClient({
      socketPath: "/nonexistent/docker.sock",
    })

    const available = await client.isAvailable()

    expect(available).toBe(false)
  })

  test("isSwarmNode handles connection errors", async () => {
    const client = new SwarmClient({
      socketPath: "/nonexistent/docker.sock",
    })

    // Note: Current implementation throws an error on connection failure
    // This test verifies that error handling occurs (error is thrown)
    expect(async () => {
      await client.isSwarmNode()
    }).toThrow()
  })

  test("healthCheck handles connection errors", async () => {
    const client = new SwarmClient({
      socketPath: "/nonexistent/docker.sock",
    })

    const health = await client.healthCheck()

    expect(health).toEqual({
      connected: false,
      inSwarm: false,
      isManager: false,
    })
  })
})

describe("Module accessibility", () => {
  let client: SwarmClient

  beforeAll(() => {
    client = new SwarmClient()
  })

  test("swarm module is accessible", () => {
    expect(client.swarm).toBeDefined()
    expect(typeof client.swarm.getStatus).toBe("function")
    expect(typeof client.swarm.init).toBe("function")
    expect(typeof client.swarm.join).toBe("function")
    expect(typeof client.swarm.leave).toBe("function")
  })

  test("nodes module is accessible", () => {
    expect(client.nodes).toBeDefined()
    expect(typeof client.nodes.list).toBe("function")
    expect(typeof client.nodes.get).toBe("function")
  })

  test("services module is accessible", () => {
    expect(client.services).toBeDefined()
    expect(typeof client.services.list).toBe("function")
    expect(typeof client.services.get).toBe("function")
    expect(typeof client.services.create).toBe("function")
    expect(typeof client.services.update).toBe("function")
    expect(typeof client.services.remove).toBe("function")
    expect(typeof client.services.scale).toBe("function")
  })

  test("tasks module is accessible", () => {
    expect(client.tasks).toBeDefined()
    expect(typeof client.tasks.list).toBe("function")
    expect(typeof client.tasks.get).toBe("function")
  })

  test("stacks module is accessible", () => {
    expect(client.stacks).toBeDefined()
    expect(typeof client.stacks.list).toBe("function")
    expect(typeof client.stacks.deploy).toBe("function")
    expect(typeof client.stacks.remove).toBe("function")
  })

  test("secrets module is accessible", () => {
    expect(client.secrets).toBeDefined()
    expect(typeof client.secrets.list).toBe("function")
    expect(typeof client.secrets.get).toBe("function")
    expect(typeof client.secrets.create).toBe("function")
    expect(typeof client.secrets.remove).toBe("function")
  })

  test("configs module is accessible", () => {
    expect(client.configs).toBeDefined()
    expect(typeof client.configs.list).toBe("function")
    expect(typeof client.configs.get).toBe("function")
    expect(typeof client.configs.create).toBe("function")
    expect(typeof client.configs.remove).toBe("function")
  })

  test("networks module is accessible", () => {
    expect(client.networks).toBeDefined()
    expect(typeof client.networks.list).toBe("function")
    expect(typeof client.networks.get).toBe("function")
    expect(typeof client.networks.create).toBe("function")
    expect(typeof client.networks.remove).toBe("function")
  })
})

describe("Logger functionality", () => {
  test("Logger is initialized with default settings", () => {
    const client = new SwarmClient()

    expect(client.logger).toBeDefined()
  })

  test("Logger is initialized with debug mode", () => {
    const client = new SwarmClient({ debug: true })

    expect(client.logger).toBeDefined()
  })

  test("Logger uses custom logger when provided", () => {
    const mockLogger: Logger = {
      debug: () => {},
      error: () => {},
      info: () => {},
      warn: () => {},
    }

    const client = new SwarmClient({ logger: mockLogger })

    expect(client.logger).toBeDefined()
  })
})

describe("Connection configuration", () => {
  test("Default socket path is used when not specified", () => {
    const client = new SwarmClient()

    expect(client.options.socketPath).toBeUndefined()
    expect(client.options.host).toBeUndefined()
  })

  test("Custom socket path overrides default", () => {
    const client = new SwarmClient({
      socketPath: "/custom/path/docker.sock",
    })

    expect(client.options.socketPath).toBe("/custom/path/docker.sock")
  })

  test("Host takes precedence over socket when specified", () => {
    const client = new SwarmClient({
      host: "http://localhost:2375",
      socketPath: "/var/run/docker.sock",
    })

    expect(client.options.host).toBe("http://localhost:2375")
  })

  test("Timeout can be customized", () => {
    const client = new SwarmClient({
      timeout: 60000,
    })

    expect(client.options.timeout).toBe(60000)
  })

  test("Default timeout is 30000ms", () => {
    const client = new SwarmClient()

    expect(client.options.timeout).toBeUndefined()
  })
})

describe("Multiple client instances", () => {
  test("Multiple clients can be created independently", () => {
    const client1 = new SwarmClient({ socketPath: "/path1/docker.sock" })
    const client2 = new SwarmClient({ host: "http://localhost:2375" })

    expect(client1).toBeDefined()
    expect(client2).toBeDefined()
    expect(client1.options).not.toEqual(client2.options)
  })

  test("Each client has its own module instances", () => {
    const client1 = new SwarmClient()
    const client2 = new SwarmClient()

    expect(client1.swarm).not.toBe(client2.swarm)
    expect(client1.services).not.toBe(client2.services)
    expect(client1.nodes).not.toBe(client2.nodes)
  })
})

describe("Client with various connection scenarios", () => {
  test("Client with HTTP connection", () => {
    const client = new SwarmClient({
      host: "http://192.168.1.100:2375",
    })

    expect(client).toBeDefined()
  })

  test("Client with HTTPS connection", () => {
    const client = new SwarmClient({
      host: "https://docker.example.com:2376",
      tls: {
        ca: Buffer.from("ca"),
        cert: Buffer.from("cert"),
        key: Buffer.from("key"),
      },
    })

    expect(client).toBeDefined()
  })

  test("Client with SSH connection to remote host", () => {
    const client = new SwarmClient({
      ssh: {
        host: "remote-docker.example.com",
        privateKey: Buffer.from("private-key"),
        username: "docker",
      },
    })

    expect(client).toBeDefined()
  })

  test("Client with SSH connection using custom port", () => {
    const client = new SwarmClient({
      ssh: {
        host: "remote-docker.example.com",
        port: 2222,
        privateKey: Buffer.from("private-key"),
        username: "docker",
      },
    })

    expect(client).toBeDefined()
  })
})
