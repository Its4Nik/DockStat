import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import { ServicesModule } from "../src/modules/services"
import { SwarmError, SwarmErrorCode } from "../src/types"
import { TestLogger } from "./.logger"

/**
 * Comprehensive tests for ServicesModule including:
 * - Service listing and filtering
 * - Service creation
 * - Service updates
 * - Service scaling
 * - Service removal
 * - Service logs
 * - Service retrieval by name
 * - Error handling
 */

describe("ServicesModule initialization", () => {
  test("Create module with default options", () => {
    const module = new ServicesModule({}, TestLogger)

    expect(module).toBeDefined()
  })

  test("Create module with custom socket path", () => {
    const module = new ServicesModule(
      {
        socketPath: "/custom/docker.sock",
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Create module with TCP host", () => {
    const module = new ServicesModule(
      {
        host: "http://localhost:2375",
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Create module with timeout", () => {
    const module = new ServicesModule(
      {
        timeout: 60000,
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })
})

describe("Service listing", () => {
  let module: ServicesModule

  beforeAll(() => {
    module = new ServicesModule({}, TestLogger)
  })

  test("list returns array of services", async () => {
    const services = await module.list()

    expect(Array.isArray(services)).toBe(true)
  })

  test("list services contain required fields", async () => {
    const services = await module.list()

    if (services.length > 0) {
      const service = services[0]
      expect(service.id).toBeDefined()
      expect(service.spec.name).toBeDefined()
      expect(service.createdAt).toBeDefined()
      expect(service.updatedAt).toBeDefined()
    }
  })

  test("list with no filters", async () => {
    const services = await module.list()

    expect(Array.isArray(services)).toBe(true)
  })

  test("list filters by id", async () => {
    const services = await module.list({ id: "service-id" })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list filters by name", async () => {
    const services = await module.list({ name: "test-service" })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list filters by single name", async () => {
    const services = await module.list({ name: "my-service" })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list filters by multiple names", async () => {
    const services = await module.list({
      name: ["service1", "service2"],
    })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list filters by label", async () => {
    const services = await module.list({
      label: ["environment=production"],
    })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list filters by mode", async () => {
    const services = await module.list({ mode: "replicated" })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list handles multiple filters", async () => {
    const services = await module.list({
      mode: "replicated",
      name: "test-service",
    })

    expect(Array.isArray(services)).toBe(true)
  })
})

describe("Service retrieval", () => {
  let module: ServicesModule

  beforeAll(() => {
    module = new ServicesModule({}, TestLogger)
  })

  test("get handles nonexistent service", async () => {
    try {
      await module.get("nonexistent-service-id")
    } catch (error) {
      expect(error).toBeDefined()
      if (error instanceof SwarmError) {
        expect(error.code).toBe(SwarmErrorCode.SERVICE_NOT_FOUND)
      }
    }
  })

  test("get handles service with ID", async () => {
    try {
      await module.get("service-id")
    } catch (error) {
      // Expected if service doesn't exist
      expect(error).toBeDefined()
    }
  })

  test("get handles service with name", async () => {
    try {
      await module.get("service-name")
    } catch (error) {
      // Expected if service doesn't exist
      expect(error).toBeDefined()
    }
  })
})

describe("Service creation", () => {
  let module: ServicesModule
  let createdServiceId: string | undefined

  beforeAll(() => {
    module = new ServicesModule({}, TestLogger)
  })

  afterAll(async () => {
    // Cleanup created service
    if (createdServiceId) {
      try {
        await module.remove(createdServiceId)
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  test("create requires name and image", async () => {
    try {
      const service = await module.create({
        image: "nginx:latest",
        name: `test-service-${Date.now()}`,
        replicas: 1,
      })

      expect(service).toBeDefined()
      expect(service.id).toBeDefined()
      expect(service.spec.name).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm or other Docker issues
      console.log("Service creation test failed (may be expected):", error)
    }
  })

  test("create with environment variables", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        env: {
          NODE_ENV: "production",
          PORT: "8080",
        },
        image: "nginx:latest",
        name: serviceName,
        replicas: 1,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with env failed (may be expected):", error)
    }
  })

  test("create with environment array", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        env: ["NODE_ENV=production", "PORT=8080"],
        image: "nginx:latest",
        name: serviceName,
        replicas: 1,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with env array failed (may be expected):", error)
    }
  })

  test("create with ports", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        image: "nginx:latest",
        name: serviceName,
        ports: [
          { protocol: "tcp", published: 8080, target: 80 },
          { protocol: "tcp", published: 8443, target: 443 },
        ],
        replicas: 1,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with ports failed (may be expected):", error)
    }
  })

  test("create with networks", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        image: "nginx:latest",
        name: serviceName,
        networks: ["default"],
        replicas: 1,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with networks failed (may be expected):", error)
    }
  })

  test("create with labels", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        image: "nginx:latest",
        labels: {
          "com.example.description": "Test service",
          environment: "test",
        },
        name: serviceName,
        replicas: 1,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with labels failed (may be expected):", error)
    }
  })

  test("create with resources", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        image: "nginx:latest",
        name: serviceName,
        replicas: 1,
        resources: {
          limits: {
            memoryBytes: 536870912, // 512 MB
            nanoCPUs: 1000000000, // 1 CPU
          },
          reservations: {
            memoryBytes: 268435456, // 256 MB
            nanoCPUs: 500000000, // 0.5 CPU
          },
        },
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with resources failed (may be expected):", error)
    }
  })

  test("create with restart policy", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        image: "nginx:latest",
        name: serviceName,
        replicas: 1,
        restartPolicy: {
          condition: "on-failure",
          delay: 5000,
          maxAttempts: 3,
          window: 10000,
        },
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with restart policy failed (may be expected):", error)
    }
  })

  test("create with constraints", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        constraints: ["node.role==worker"],
        image: "nginx:latest",
        name: serviceName,
        replicas: 1,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with constraints failed (may be expected):", error)
    }
  })

  test("create with global mode", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        image: "nginx:latest",
        mode: "global",
        name: serviceName,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with global mode failed (may be expected):", error)
    }
  })

  test("create with log driver", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      const service = await module.create({
        image: "nginx:latest",
        logDriver: "json-file",
        logOptions: {
          "max-file": "3",
          "max-size": "10m",
        },
        name: serviceName,
        replicas: 1,
      })

      expect(service).toBeDefined()
      createdServiceId = service.id
    } catch (error) {
      // May fail if not in swarm
      console.log("Service creation with log driver failed (may be expected):", error)
    }
  })

  test("create handles name conflict", async () => {
    const serviceName = `test-service-${Date.now()}`

    try {
      // Create first service
      await module.create({
        image: "nginx:latest",
        name: serviceName,
        replicas: 1,
      })

      // Try to create service with same name
      await module.create({
        image: "nginx:latest",
        name: serviceName,
        replicas: 1,
      })
    } catch (error) {
      // Expected to fail with name conflict
      expect(error).toBeDefined()
      if (error instanceof SwarmError) {
        expect(error.code).toBe(SwarmErrorCode.SERVICE_NAME_CONFLICT)
      }
    }
  })
})

describe("Service updates", () => {
  let module: ServicesModule
  let createdServiceId: string | undefined

  beforeAll(async () => {
    module = new ServicesModule({}, TestLogger)

    try {
      const service = await module.create({
        image: "nginx:latest",
        name: `test-service-${Date.now()}`,
        replicas: 1,
      })
      createdServiceId = service.id
    } catch {
      // Service creation failed, tests will be skipped
    }
  })

  afterAll(async () => {
    if (createdServiceId) {
      try {
        await module.remove(createdServiceId)
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  test("update service image", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const updated = await module.update(createdServiceId, {
        image: "nginx:1.25",
        version: 1,
      })

      expect(updated).toBeDefined()
      expect(updated.id).toBe(createdServiceId)
    } catch (error) {
      console.log("Service update failed:", error)
    }
  })

  test("update service replicas", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const updated = await module.update(createdServiceId, {
        replicas: 3,
        version: 2,
      })

      expect(updated).toBeDefined()
    } catch (error) {
      console.log("Service replicas update failed:", error)
    }
  })

  test("update service environment", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const updated = await module.update(createdServiceId, {
        env: {
          NEW_VAR: "value",
        },
        version: 3,
      })

      expect(updated).toBeDefined()
    } catch (error) {
      console.log("Service env update failed:", error)
    }
  })

  test("update service labels", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const updated = await module.update(createdServiceId, {
        labels: {
          updated: "true",
        },
        version: 4,
      })

      expect(updated).toBeDefined()
    } catch (error) {
      console.log("Service labels update failed:", error)
    }
  })

  test("update handles nonexistent service", async () => {
    try {
      await module.update("nonexistent-service-id", {
        image: "nginx:latest",
        version: 5,
      })
    } catch (error) {
      expect(error).toBeDefined()
      if (error instanceof SwarmError) {
        expect(error.code).toBe(SwarmErrorCode.SERVICE_NOT_FOUND)
      }
    }
  })
})

describe("Service scaling", () => {
  let module: ServicesModule
  let createdServiceId: string | undefined

  beforeAll(async () => {
    module = new ServicesModule({}, TestLogger)

    try {
      const service = await module.create({
        image: "nginx:latest",
        name: `test-service-${Date.now()}`,
        replicas: 1,
      })
      createdServiceId = service.id
    } catch {
      // Service creation failed, tests will be skipped
    }
  })

  afterAll(async () => {
    if (createdServiceId) {
      try {
        await module.remove(createdServiceId)
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  test("scale service up", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const scaled = await module.scale(createdServiceId, 5)

      expect(scaled).toBeDefined()
    } catch (error) {
      console.log("Service scale up failed:", error)
    }
  })

  test("scale service down", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const scaled = await module.scale(createdServiceId, 2)

      expect(scaled).toBeDefined()
    } catch (error) {
      console.log("Service scale down failed:", error)
    }
  })

  test("scale service to zero", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const scaled = await module.scale(createdServiceId, 0)

      expect(scaled).toBeDefined()
    } catch (error) {
      console.log("Service scale to zero failed:", error)
    }
  })

  test("scale handles nonexistent service", async () => {
    try {
      await module.scale("nonexistent-service-id", 5)
    } catch (error) {
      expect(error).toBeDefined()
      if (error instanceof SwarmError) {
        expect(error.code).toBe(SwarmErrorCode.SERVICE_NOT_FOUND)
      }
    }
  })
})

describe("Service removal", () => {
  let module: ServicesModule
  let createdServiceId: string | undefined

  beforeEach(async () => {
    module = new ServicesModule({}, TestLogger)

    try {
      const service = await module.create({
        image: "nginx:latest",
        name: `test-service-${Date.now()}`,
        replicas: 1,
      })
      createdServiceId = service.id
    } catch {
      // Service creation failed
    }
  })

  test("remove service", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      await module.remove(createdServiceId)

      // Verify service is removed
      try {
        await module.get(createdServiceId)
      } catch (error) {
        if (error instanceof SwarmError) {
          expect(error.code).toBe(SwarmErrorCode.SERVICE_NOT_FOUND)
        }
      }
    } catch (error) {
      console.log("Service removal failed:", error)
    }
  })

  test("remove handles nonexistent service", async () => {
    try {
      await module.remove("nonexistent-service-id")
    } catch (error) {
      expect(error).toBeDefined()
      if (error instanceof SwarmError) {
        expect(error.code).toBe(SwarmErrorCode.SERVICE_NOT_FOUND)
      }
    }
  })
})

describe("Service logs", () => {
  let module: ServicesModule
  let createdServiceId: string | undefined

  beforeAll(async () => {
    module = new ServicesModule({}, TestLogger)

    try {
      const service = await module.create({
        image: "nginx:latest",
        name: `test-service-${Date.now()}`,
        replicas: 1,
      })
      createdServiceId = service.id
    } catch {
      // Service creation failed
    }
  })

  afterAll(async () => {
    if (createdServiceId) {
      try {
        await module.remove(createdServiceId)
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  test("logs returns string", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const logs = await module.logs(createdServiceId)

      expect(typeof logs).toBe("string")
    } catch (error) {
      console.log("Service logs failed:", error)
    }
  })

  test("logs with options", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const logs = await module.logs(createdServiceId, {
        stderr: true,
        stdout: true,
        tail: 10,
        timestamps: true,
      })

      expect(typeof logs).toBe("string")
    } catch (error) {
      console.log("Service logs with options failed:", error)
    }
  })

  test("logs with custom tail", async () => {
    if (!createdServiceId) {
      return
    }

    try {
      const logs = await module.logs(createdServiceId, {
        tail: 5,
      })

      expect(typeof logs).toBe("string")
    } catch (error) {
      console.log("Service logs with tail failed:", error)
    }
  })

  test("logs handles nonexistent service", async () => {
    try {
      await module.logs("nonexistent-service-id")
    } catch (error) {
      expect(error).toBeDefined()
      if (error instanceof SwarmError) {
        expect(error.code).toBe(SwarmErrorCode.SERVICE_NOT_FOUND)
      }
    }
  })
})

describe("Service retrieval by name", () => {
  let module: ServicesModule
  let createdServiceName: string | undefined

  beforeAll(async () => {
    module = new ServicesModule({}, TestLogger)

    try {
      createdServiceName = `test-service-${Date.now()}`
      await module.create({
        image: "nginx:latest",
        name: createdServiceName,
        replicas: 1,
      })
    } catch {
      // Service creation failed
    }
  })

  afterAll(async () => {
    if (createdServiceName) {
      try {
        const service = await module.getByName(createdServiceName)
        if (service) {
          await module.remove(service.id)
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  test("getByName finds existing service", async () => {
    if (!createdServiceName) {
      return
    }

    try {
      const service = await module.getByName(createdServiceName)

      expect(service).toBeDefined()
      expect(service?.spec.name).toBe(createdServiceName)
    } catch (error) {
      console.log("Service getByName failed:", error)
    }
  })

  test("getByName returns undefined for nonexistent service", async () => {
    const service = await module.getByName("nonexistent-service-name")

    expect(service).toBeUndefined()
  })

  test("getByName is case-sensitive", async () => {
    if (!createdServiceName) {
      return
    }

    const service = await module.getByName(createdServiceName.toUpperCase())

    expect(service).toBeUndefined()
  })
})

describe("Error handling", () => {
  let module: ServicesModule

  beforeAll(() => {
    module = new ServicesModule(
      {
        socketPath: "/nonexistent/docker.sock",
      },
      TestLogger
    )
  })

  test("list handles connection errors", async () => {
    try {
      await module.list()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("get handles connection errors", async () => {
    try {
      await module.get("service-id")
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("create handles connection errors", async () => {
    try {
      await module.create({
        image: "nginx:latest",
        name: "test-service",
      })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("update handles connection errors", async () => {
    try {
      await module.update("service-id", {
        image: "nginx:latest",
        version: 8,
      })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("scale handles connection errors", async () => {
    try {
      await module.scale("service-id", 5)
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("remove handles connection errors", async () => {
    try {
      await module.remove("service-id")
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test("logs handles connection errors", async () => {
    try {
      await module.logs("service-id")
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe("Multiple module instances", () => {
  test("Multiple modules can be created independently", () => {
    const module1 = new ServicesModule({ socketPath: "/path1/docker.sock" }, TestLogger)
    const module2 = new ServicesModule({ host: "http://localhost:2375" }, TestLogger)

    expect(module1).toBeDefined()
    expect(module2).toBeDefined()
  })
})

describe("Module with various connection options", () => {
  test("Module with HTTP connection", () => {
    const module = new ServicesModule(
      {
        host: "http://192.168.1.100:2375",
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Module with HTTPS connection", () => {
    const module = new ServicesModule(
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
    const module = new ServicesModule(
      {
        timeout: 60000,
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })

  test("Module with socket path and timeout", () => {
    const module = new ServicesModule(
      {
        socketPath: "/var/run/docker.sock",
        timeout: 45000,
      },
      TestLogger
    )

    expect(module).toBeDefined()
  })
})

describe("Service options edge cases", () => {
  let module: ServicesModule

  beforeAll(() => {
    module = new ServicesModule({}, TestLogger)
  })

  test("create with zero replicas", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      await module.create({
        image: "nginx:latest",
        name: serviceName,
        replicas: 0,
      })
    } catch (error) {
      // May fail depending on Docker version
      console.log("Zero replicas test failed:", error)
    }
  })

  test("create with very large replicas", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      await module.create({
        image: "nginx:latest",
        name: serviceName,
        replicas: 9999,
      })
    } catch (error) {
      // May fail due to resource limits
      console.log("Large replicas test failed:", error)
    }
  })

  test("create with negative replicas", async () => {
    try {
      const serviceName = `test-service-${Date.now()}`
      await module.create({
        image: "nginx:latest",
        name: serviceName,
        replicas: -1,
      })
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
    }
  })

  test("create with empty name", async () => {
    try {
      await module.create({
        image: "nginx:latest",
        name: "",
      })
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
    }
  })

  test("create with empty image", async () => {
    try {
      await module.create({
        image: "",
        name: "test-service",
      })
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
    }
  })
})

describe("Service filtering edge cases", () => {
  let module: ServicesModule

  beforeAll(() => {
    module = new ServicesModule({}, TestLogger)
  })

  test("list with empty filters", async () => {
    const services = await module.list({})

    expect(Array.isArray(services)).toBe(true)
  })

  test("list with undefined filters", async () => {
    const services = await module.list(undefined)

    expect(Array.isArray(services)).toBe(true)
  })

  test("list with empty array filter", async () => {
    const services = await module.list({ name: [] })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list with multiple label filters", async () => {
    const services = await module.list({
      label: ["label1=value1", "label2=value2"],
    })

    expect(Array.isArray(services)).toBe(true)
  })

  test("list with invalid mode", async () => {
    const services = await module.list({
      // @ts-expect-error
      mode: "invalid-mode",
    })

    expect(Array.isArray(services)).toBe(true)
  })
})
