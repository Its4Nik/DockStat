import Elysia, { t } from "elysia"
import { DNH } from "../../docker/docknode"
import { DockNodeModel } from "../../models/docknode"

export const DockNodeElyisa = new Elysia({
  detail: { tags: ["DockNode"] },
  prefix: "/node",
})
  .get("/", async ({ status }) => {
    return status(200, await DNH.getAllNodes())
  })
  .post(
    "/",
    ({ body }) => {
      DNH.createNode(body)
    },
    { body: DockNodeModel.createBody }
  )
  .delete("/", ({ body }) => DNH.delteNode(body.id), {
    body: DockNodeModel.deleteBody,
  })

  // ---- Stack Routes (Compose Stacks)
  .get(
    "/:nodeId/stacks",
    async ({ params }) => {
      return DNH.listStacks(Number(params.nodeId))
    },
    {
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .get(
    "/:nodeId/stacks/:stackId",
    async ({ params }) => {
      return DNH.getStack(Number(params.nodeId), Number(params.stackId))
    },
    {
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .post(
    "/:nodeId/stacks",
    async ({ params, body }) => {
      return DNH.createStack(Number(params.nodeId), body)
    },
    {
      body: t.Object({
        env: t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()])),
        name: t.String(),
        repoName: t.String(),
        repository: t.String(),
        version: t.String(),
        yaml: t.String(),
      }),
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .patch(
    "/:nodeId/stacks/:stackId",
    async ({ params, body }) => {
      return DNH.updateStack(Number(params.nodeId), Number(params.stackId), body)
    },
    {
      body: t.Object({
        env: t.Optional(
          t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))
        ),
        version: t.Optional(t.String()),
        yaml: t.Optional(t.String()),
      }),
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .delete(
    "/:nodeId/stacks/:stackId",
    async ({ params, query }) => {
      return DNH.deleteStack(
        Number(params.nodeId),
        Number(params.stackId),
        query.removeFiles === "true"
      )
    },
    {
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
      query: t.Object({ removeFiles: t.Optional(t.String()) }),
    }
  )

  .patch(
    "/:nodeId/stacks/:stackId/rename",
    async ({ params, body }) => {
      return DNH.renameStack(Number(params.nodeId), Number(params.stackId), body.name)
    },
    {
      body: t.Object({ name: t.String() }),
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .get(
    "/:nodeId/stacks/:stackId/export",
    async ({ params }) => {
      return DNH.exportStack(Number(params.nodeId), Number(params.stackId))
    },
    {
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  // ---- Stack Lifecycle
  .post(
    "/:nodeId/stacks/:stackId/up",
    async ({ params, body }) => {
      return DNH.stackUp(Number(params.nodeId), Number(params.stackId), body?.services)
    },
    {
      body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .post(
    "/:nodeId/stacks/:stackId/down",
    async ({ params, body }) => {
      return DNH.stackDown(Number(params.nodeId), Number(params.stackId), body || undefined)
    },
    {
      body: t.Optional(
        t.Object({
          removeOrphans: t.Optional(t.Boolean()),
          volumes: t.Optional(t.Boolean()),
        })
      ),
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .post(
    "/:nodeId/stacks/:stackId/stop",
    async ({ params, body }) => {
      return DNH.stackStop(Number(params.nodeId), Number(params.stackId), body?.services)
    },
    {
      body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .post(
    "/:nodeId/stacks/:stackId/restart",
    async ({ params, body }) => {
      return DNH.stackRestart(Number(params.nodeId), Number(params.stackId), body?.services)
    },
    {
      body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .post(
    "/:nodeId/stacks/:stackId/pull",
    async ({ params, body }) => {
      return DNH.stackPull(Number(params.nodeId), Number(params.stackId), body?.services)
    },
    {
      body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .get(
    "/:nodeId/stacks/:stackId/ps",
    async ({ params }) => {
      return DNH.stackPs(Number(params.nodeId), Number(params.stackId))
    },
    {
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
    }
  )

  .get(
    "/:nodeId/stacks/:stackId/logs",
    async ({ params, query }) => {
      return DNH.stackLogs(Number(params.nodeId), Number(params.stackId), {
        follow: query.follow === "true",
        services: query.services,
        tail: query.tail ? Number(query.tail) : undefined,
      })
    },
    {
      params: t.Object({ nodeId: t.String(), stackId: t.String() }),
      query: t.Object({
        follow: t.Optional(t.String()),
        services: t.Optional(t.String()),
        tail: t.Optional(t.String()),
      }),
    }
  )

  // ---- Swarm Routes
  .get(
    "/:nodeId/swarm/status",
    async ({ params }) => {
      return DNH.getSwarmStatus(Number(params.nodeId))
    },
    {
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .get(
    "/:nodeId/swarm/stacks",
    async ({ params }) => {
      return DNH.listSwarmStacks(Number(params.nodeId))
    },
    {
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .get(
    "/:nodeId/swarm/stacks/:name",
    async ({ params }) => {
      return DNH.getSwarmStack(Number(params.nodeId), params.name)
    },
    {
      params: t.Object({ name: t.String(), nodeId: t.String() }),
    }
  )

  .post(
    "/:nodeId/swarm/stacks/deploy",
    async ({ params, body }) => {
      return DNH.deploySwarmStack(Number(params.nodeId), body)
    },
    {
      body: t.Object({
        composeFile: t.String(),
        name: t.String(),
        prune: t.Optional(t.Boolean()),
        resolveImage: t.Optional(
          t.Union([t.Literal("always"), t.Literal("changed"), t.Literal("never")])
        ),
        withRegistryAuth: t.Optional(t.Boolean()),
      }),
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .delete(
    "/:nodeId/swarm/stacks/:name",
    async ({ params, query }) => {
      return DNH.removeSwarmStack(Number(params.nodeId), params.name, query.prune === "true")
    },
    {
      params: t.Object({ name: t.String(), nodeId: t.String() }),
      query: t.Object({ prune: t.Optional(t.String()) }),
    }
  )

  .get(
    "/:nodeId/swarm/services",
    async ({ params }) => {
      return DNH.listSwarmServices(Number(params.nodeId))
    },
    {
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .get(
    "/:nodeId/swarm/services/:serviceId",
    async ({ params }) => {
      return DNH.getSwarmService(Number(params.nodeId), params.serviceId)
    },
    {
      params: t.Object({ nodeId: t.String(), serviceId: t.String() }),
    }
  )

  .post(
    "/:nodeId/swarm/services/:serviceId/scale",
    async ({ params, body }) => {
      return DNH.scaleSwarmService(Number(params.nodeId), params.serviceId, body.replicas)
    },
    {
      body: t.Object({ replicas: t.Number() }),
      params: t.Object({ nodeId: t.String(), serviceId: t.String() }),
    }
  )

  .patch(
    "/:nodeId/swarm/services/:serviceId",
    async ({ params, body }) => {
      return DNH.updateSwarmService(Number(params.nodeId), params.serviceId, body)
    },
    {
      body: t.Object({
        constraints: t.Optional(t.Array(t.String())),
        env: t.Optional(
          t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))
        ),
        image: t.Optional(t.String()),
        labels: t.Optional(t.Record(t.String(), t.String())),
        replicas: t.Optional(t.Number()),
      }),
      params: t.Object({ nodeId: t.String(), serviceId: t.String() }),
    }
  )

  .delete(
    "/:nodeId/swarm/services/:serviceId",
    async ({ params }) => {
      return DNH.removeSwarmService(Number(params.nodeId), params.serviceId)
    },
    {
      params: t.Object({ nodeId: t.String(), serviceId: t.String() }),
    }
  )

  .get(
    "/:nodeId/swarm/nodes",
    async ({ params }) => {
      return DNH.listSwarmNodes(Number(params.nodeId))
    },
    {
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .get(
    "/:nodeId/swarm/tasks",
    async ({ params, query }) => {
      return DNH.listSwarmTasks(Number(params.nodeId), query.serviceId)
    },
    {
      params: t.Object({ nodeId: t.String() }),
      query: t.Object({ serviceId: t.Optional(t.String()) }),
    }
  )

  .post(
    "/:nodeId/swarm/init",
    async ({ params, body }) => {
      return DNH.initSwarm(Number(params.nodeId), body)
    },
    {
      body: t.Object({
        advertiseAddr: t.Optional(t.String()),
        forceNewCluster: t.Optional(t.Boolean()),
        listenAddr: t.Optional(t.String()),
      }),
      params: t.Object({ nodeId: t.String() }),
    }
  )

  .post(
    "/:nodeId/swarm/leave",
    async ({ params, query }) => {
      return DNH.leaveSwarm(Number(params.nodeId), query.force === "true")
    },
    {
      params: t.Object({ nodeId: t.String() }),
      query: t.Object({ force: t.Optional(t.String()) }),
    }
  )
