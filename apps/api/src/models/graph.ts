import { t } from "elysia"

export namespace GraphModel {
  export const GraphNodeType = t.Union([
    t.Literal("docknode"),
    t.Literal("host"),
    t.Literal("container"),
    t.Literal("client"),
  ])

  export const GraphNodeSchema = t.Object({
    id: t.String(),
    type: GraphNodeType,
    position: t.Object({
      x: t.Number(),
      y: t.Number(),
    }),
    data: t.Object({
      label: t.String(),
      status: t.String(),
      ipAddress: t.Optional(t.String()),
      port: t.Optional(t.Number()),
      image: t.Optional(t.String()),
      clientId: t.Optional(t.Number()),
      hostId: t.Optional(t.Number()),
    }),
  })

  export const GraphEdgeSchema = t.Object({
    id: t.String(),
    source: t.String(),
    target: t.String(),
    animated: t.Optional(t.Boolean()),
    style: t.Optional(
      t.Object({
        stroke: t.Optional(t.String()),
      })
    ),
  })

  export const GraphDataSchema = t.Object({
    nodes: t.Array(GraphNodeSchema),
    edges: t.Array(GraphEdgeSchema),
    clients: t.Array(
      t.Object({
        id: t.Number(),
        name: t.String(),
        initialized: t.Boolean(),
      })
    ),
    hosts: t.Array(
      t.Object({
        id: t.Number(),
        name: t.String(),
        clientId: t.Number(),
        reachable: t.Boolean(),
      })
    ),
    dockNodes: t.Array(
      t.Object({
        id: t.Number(),
        name: t.String(),
        hostname: t.String(),
        port: t.Number(),
        reachable: t.Union([
          t.Literal("OK"),
          t.Literal("NO"),
          t.Literal("DockNode not initialised"),
        ]),
      })
    ),
    containers: t.Array(t.Any()),
  })
}
