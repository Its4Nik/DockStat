import Elysia, { t } from "elysia"
import StackHandler from "."
import SwarmHandler from "./swarm"
import type { EnvMap } from "./types"

const handler = new StackHandler()

/** Response type for DockStore stack fetch */
interface DockStoreStackResponse {
  success: boolean
  yaml?: string
  envSchema?: EnvMap
  error?: string
}

/** Fetch stack from a DockStore repository */
async function fetchStackFromStore(repoUrl: string, stackName: string): Promise<DockStoreStackResponse> {
  try {
    // Construct URLs for stack files
    const baseUrl = repoUrl.replace(/\/$/, "")
    const yamlUrl = `${baseUrl}/stacks/${stackName}/docker-compose.yaml`
    const envSchemaUrl = `${baseUrl}/stacks/${stackName}/env-schema.json`

    // Fetch compose file
    const yamlResponse = await fetch(yamlUrl)
    if (!yamlResponse.ok) {
      return {
        success: false,
        error: `Failed to fetch compose file: ${yamlResponse.status} ${yamlResponse.statusText}`,
      }
    }
    const yaml = await yamlResponse.text()

    // Try to fetch env schema (optional)
    let envSchema: EnvMap = {}
    try {
      const envResponse = await fetch(envSchemaUrl)
      if (envResponse.ok) {
        envSchema = await envResponse.json() as EnvMap
      }
    } catch {
      // envSchema is optional, continue without it
    }

    return {
      success: true,
      yaml,
      envSchema,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export const DockStacksRoutes = new Elysia({ prefix: "/stacks" })
  // ---- List & Get Stacks
  .get("/", () => handler.listStacks())
  .get("/networks", () => handler.getNetworkStats())

  .get("/:id", ({ params }) => handler.getStack(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  .get("/:id/export", ({ params }) => handler.exportStack(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  // ---- Create, Update, Delete
  .post("/", ({ body }) => handler.createStack(body), {
    body: t.Object({
      name: t.String(),
      yaml: t.String(),
      repository: t.String(),
      repoName: t.String(),
      version: t.String(),
      env: t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()])),
      dockNodeId: t.Optional(t.Number()),
    }),
  })

  // ---- Create Stack from DockStore
  .post("/from-store", async ({ body }) => {
    const { repoUrl, stackName, nodeId, env } = body

    // Fetch stack from DockStore
    const fetchResult = await fetchStackFromStore(repoUrl, stackName)
    if (!fetchResult.success) {
      return {
        success: false,
        error: fetchResult.error,
      }
    }

    // Create the stack with fetched data
    const createResult = await handler.createStack({
      name: stackName,
      yaml: fetchResult.yaml ?? "",
      repository: repoUrl,
      repoName: stackName,
      version: "1.0.0",
      env: env ?? fetchResult.envSchema ?? {},
      dockNodeId: nodeId,
    })

    return createResult
  }, {
    body: t.Object({
      repoUrl: t.String(),
      stackName: t.String(),
      nodeId: t.Optional(t.Number()),
      env: t.Optional(t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))),
    }),
  })

  .patch("/:id", ({ params, body }) => handler.updateStack(Number(params.id), body), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Object({
      version: t.Optional(t.String()),
      yaml: t.Optional(t.String()),
      env: t.Optional(
        t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))
      ),
    }),
  })

  .patch("/:id/rename", ({ params, body }) => handler.renameStack(Number(params.id), body.name), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Object({ name: t.String() }),
  })

  .delete(
    "/:id",
    ({ params, query }) =>
      handler.deleteStack(Number(params.id), { removeFiles: query.removeFiles !== "false" }),
    {
      params: t.Object({ id: t.Numeric() }),
      query: t.Object({ removeFiles: t.Optional(t.String()) }),
    }
  )

  // ---- Docker Compose: Lifecycle
  .post("/:id/up", ({ params, body }) => handler.up(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  .post("/:id/down", ({ params, body }) => handler.down(Number(params.id), body || undefined), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(
      t.Object({
        volumes: t.Optional(t.Boolean()),
        removeOrphans: t.Optional(t.Boolean()),
      })
    ),
  })

  .post("/:id/stop", ({ params, body }) => handler.stop(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  .post("/:id/restart", ({ params, body }) => handler.restart(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  // ---- Docker Compose: Build & Pull
  .post("/:id/pull", ({ params, body }) => handler.pull(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  // ---- Docker Compose: Info & Logs
  .get("/:id/ps", ({ params }) => handler.ps(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  .get(
    "/:id/logs",
    ({ params, query }) =>
      handler.logs(Number(params.id), query.services?.split(","), {
        follow: query.follow === "true",
        tail: query.tail ? Number(query.tail) : undefined,
      }),
    {
      params: t.Object({ id: t.Numeric() }),
      query: t.Object({
        services: t.Optional(t.String()),
        follow: t.Optional(t.String()),
        tail: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/:id/config",
    ({ params, query }) =>
      handler.config(Number(params.id), {
        services: query.services === "true",
        volumes: query.volumes === "true",
      }),
    {
      params: t.Object({ id: t.Numeric() }),
      query: t.Object({
        services: t.Optional(t.String()),
        volumes: t.Optional(t.String()),
      }),
    }
  )

  .get("/:id/config/services", ({ params }) => handler.configServices(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  .get("/:id/config/volumes", ({ params }) => handler.configVolumes(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  // ---- Docker Compose: Execute & Run
  .post(
    "/:id/exec",
    ({ params, body }) => handler.exec(Number(params.id), body.service, body.command),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        service: t.String(),
        command: t.Union([t.String(), t.Array(t.String())]),
      }),
    }
  )

  .post(
    "/:id/run",
    ({ params, body }) => handler.run(Number(params.id), body.service, body.command, body.options),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        service: t.String(),
        command: t.Union([t.String(), t.Array(t.String())]),
        options: t.Optional(t.Object({ rm: t.Optional(t.Boolean()) })),
      }),
    }
  )

  // ---- Docker Compose: Remove & Kill
  .delete(
    "/:id/containers",
    ({ params, body }) => handler.rm(Number(params.id), body?.services, body?.options),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Optional(
        t.Object({
          services: t.Optional(t.Array(t.String())),
          options: t.Optional(
            t.Object({
              force: t.Optional(t.Boolean()),
              volumes: t.Optional(t.Boolean()),
            })
          ),
        })
      ),
    }
  )

  .post("/:id/kill", ({ params, body }) => handler.kill(Number(params.id), body?.signal), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(
      t.Object({
        signal: t.Optional(t.String()),
      })
    ),
  })

  // ---- Docker Compose: Port
  .get(
    "/:id/port/:service/:port",
    ({ params, query }) =>
      handler.port(Number(params.id), params.service, Number(params.port), {
        protocol: query.protocol,
      }),
    {
      params: t.Object({
        id: t.Numeric(),
        service: t.String(),
        port: t.Numeric(),
      }),
      query: t.Object({ protocol: t.Optional(t.String()) }),
    }
  )

  // ---- Docker Compose Version
  .get("/docker/version", () => handler.version())

// ============================================
// Docker Swarm Routes
// ============================================

export const SwarmRoutes = new Elysia({ prefix: "/swarm" })
  // ---- Swarm Cluster Operations
  .get("/status", () => SwarmHandler.getSwarmStatus())

  .post("/init", ({ body }) => SwarmHandler.initSwarm(body), {
    body: t.Object({
      advertiseAddr: t.Optional(t.String()),
      listenAddr: t.Optional(t.String()),
      forceNewCluster: t.Optional(t.Boolean()),
      swarmDefaultAddrPool: t.Optional(t.Array(t.String())),
      subnetSize: t.Optional(t.Number()),
      dataPathAddr: t.Optional(t.String()),
      dataPathPort: t.Optional(t.Number()),
    }),
  })

  .post("/join", ({ body }) => SwarmHandler.joinSwarm(body), {
    body: t.Object({
      remoteAddrs: t.Array(t.String()),
      joinToken: t.String(),
      listenAddr: t.Optional(t.String()),
      advertiseAddr: t.Optional(t.String()),
      dataPathAddr: t.Optional(t.String()),
    }),
  })

  .post("/leave", ({ body }) => SwarmHandler.leaveSwarm(body?.force ?? false), {
    body: t.Optional(t.Object({ force: t.Optional(t.Boolean()) })),
  })

  // ---- Swarm Stack Operations
  .get("/stacks", () => SwarmHandler.listStacks())

  .post("/stacks/get", ({ body }) => SwarmHandler.getStack(body.name), {
    body: t.Object({ name: t.String() }),
  })

  .post("/stacks/deploy", ({ body }) => SwarmHandler.deployStack(body), {
    body: t.Object({
      name: t.String(),
      composeFile: t.String(),
      withRegistryAuth: t.Optional(t.Boolean()),
      prune: t.Optional(t.Boolean()),
      resolveImage: t.Optional(t.Union([t.Literal("always"), t.Literal("changed"), t.Literal("never")])),
      detach: t.Optional(t.Boolean()),
    }),
  })

  .post("/stacks/remove", ({ body }) =>
    SwarmHandler.removeStack({ name: body.name, prune: body.prune ?? false }),
    {
      body: t.Object({
        name: t.String(),
        prune: t.Optional(t.Boolean()),
      }),
    }
  )

  // ---- Swarm Service Operations
  .get("/services", () => SwarmHandler.listServices())

  .post("/services/get", ({ body }) => SwarmHandler.getService(body.id), {
    body: t.Object({ id: t.String() }),
  })

  .post("/services", ({ body }) => SwarmHandler.createService(body), {
    body: t.Object({
      name: t.String(),
      image: t.String(),
      replicas: t.Optional(t.Number()),
      env: t.Optional(t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))),
      labels: t.Optional(t.Record(t.String(), t.String())),
      constraints: t.Optional(t.Array(t.String())),
      networks: t.Optional(t.Array(t.String())),
      ports: t.Optional(
        t.Array(
          t.Object({
            publishedPort: t.Number(),
            targetPort: t.Number(),
            protocol: t.Union([t.Literal("tcp"), t.Literal("udp"), t.Literal("sctp")]),
            mode: t.Union([t.Literal("ingress"), t.Literal("host")]),
          })
        )
      ),
      mounts: t.Optional(
        t.Array(
          t.Object({
            source: t.String(),
            target: t.String(),
            readOnly: t.Optional(t.Boolean()),
            type: t.Union([t.Literal("bind"), t.Literal("volume"), t.Literal("tmpfs")]),
          })
        )
      ),
      resources: t.Optional(
        t.Object({
          limits: t.Optional(
            t.Object({
              nanoCpu: t.Optional(t.Number()),
              memoryBytes: t.Optional(t.Number()),
            })
          ),
          reservations: t.Optional(
            t.Object({
              nanoCpu: t.Optional(t.Number()),
              memoryBytes: t.Optional(t.Number()),
            })
          ),
        })
      ),
      restartPolicy: t.Optional(
        t.Object({
          condition: t.Union([t.Literal("none"), t.Literal("on-failure"), t.Literal("any")]),
          delay: t.Optional(t.Number()),
          maxAttempts: t.Optional(t.Number()),
          window: t.Optional(t.Number()),
        })
      ),
      healthCheck: t.Optional(
        t.Object({
          test: t.Array(t.String()),
          interval: t.Optional(t.Number()),
          timeout: t.Optional(t.Number()),
          retries: t.Optional(t.Number()),
          startPeriod: t.Optional(t.Number()),
        })
      ),
    }),
  })

  .post("/services/update", ({ body }) => {
    if (!body) throw new Error("Request body is required")
    return SwarmHandler.updateService(body)
  }, {
    body: t.Object({
      serviceId: t.String(),
      image: t.Optional(t.String()),
      env: t.Optional(t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))),
      replicas: t.Optional(t.Number()),
      constraints: t.Optional(t.Array(t.String())),
      labels: t.Optional(t.Record(t.String(), t.String())),
      restartPolicy: t.Optional(
        t.Object({
          condition: t.Union([t.Literal("none"), t.Literal("on-failure"), t.Literal("any")]),
          delay: t.Optional(t.Number()),
          maxAttempts: t.Optional(t.Number()),
          window: t.Optional(t.Number()),
        })
      ),
      resources: t.Optional(
        t.Object({
          limits: t.Optional(
            t.Object({
              nanoCpu: t.Optional(t.Number()),
              memoryBytes: t.Optional(t.Number()),
            })
          ),
          reservations: t.Optional(
            t.Object({
              nanoCpu: t.Optional(t.Number()),
              memoryBytes: t.Optional(t.Number()),
            })
          ),
        })
      ),
    }),
  })

  .post("/services/scale", ({ body }) =>
    SwarmHandler.scaleService(body.serviceId, body.replicas),
    {
      body: t.Object({ serviceId: t.String(), replicas: t.Number() }),
    }
  )

  .post("/services/remove", ({ body }) => SwarmHandler.removeService(body.serviceId), {
    body: t.Object({ serviceId: t.String() }),
  })

  // ---- Swarm Node Operations
  .get("/nodes", () => SwarmHandler.listNodes())

  .post("/nodes/get", ({ body }) => SwarmHandler.getNode(body.id), {
    body: t.Object({ id: t.String() }),
  })

  .post("/nodes/update", ({ body }) => {
    if (!body) throw new Error("Request body is required")
    return SwarmHandler.updateNode(body.id, {
      availability: body.availability,
      labels: body.labels,
    })
  },
    {
      body: t.Object({
        id: t.String(),
        availability: t.Optional(t.Union([t.Literal("active"), t.Literal("pause"), t.Literal("drain")])),
        labels: t.Optional(t.Record(t.String(), t.String())),
      }),
    }
  )

  .post("/nodes/remove", ({ body }) =>
    SwarmHandler.removeNode(body.id, body.force ?? false),
    {
      body: t.Object({
        id: t.String(),
        force: t.Optional(t.Boolean()),
      }),
    }
  )

  // ---- Swarm Task Operations
  .post("/tasks/list", ({ body }) => {
    if (!body) return SwarmHandler.listTasks()
    return SwarmHandler.listTasks(body.serviceId)
  }, {
    body: t.Optional(t.Object({ serviceId: t.Optional(t.String()) })),
  })

  // ---- Swarm Network Operations
  .get("/networks", () => SwarmHandler.listNetworks())

  .post("/networks", ({ body }) => SwarmHandler.createNetwork(body), {
    body: t.Object({
      name: t.String(),
      driver: t.Optional(t.String()),
      attachable: t.Optional(t.Boolean()),
      subnet: t.Optional(t.String()),
      labels: t.Optional(t.Record(t.String(), t.String())),
    }),
  })

  .post("/networks/remove", ({ body }) => SwarmHandler.removeNetwork(body.id), {
    body: t.Object({ id: t.String() }),
  })
