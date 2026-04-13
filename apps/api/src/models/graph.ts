import { t } from "elysia"

export namespace GraphModel {
  export const GraphNodeType = t.Union([
    t.Literal("docknode"),
    t.Literal("host"),
    t.Literal("container"),
    t.Literal("client"),
  ])

  export const GraphNodeSchema = t.Object({
    data: t.Object({
      clientId: t.Optional(t.Number()),
      containerId: t.Optional(t.String()),
      dockNodeId: t.Optional(t.Number()),
      hostId: t.Optional(t.Number()),
      image: t.Optional(t.String()),
      ipAddress: t.Optional(t.String()),
      label: t.String(),
      port: t.Optional(t.Number()),
      state: t.Optional(t.String()),
      status: t.String(),
    }),
    id: t.String(),
    position: t.Object({
      x: t.Number(),
      y: t.Number(),
    }),
    type: GraphNodeType,
  })

  export const GraphEdgeSchema = t.Object({
    animated: t.Optional(t.Boolean()),
    edgesReconnectable: t.Optional(t.Boolean()),
    id: t.String(),
    label: t.Optional(t.String()),
    source: t.String(),
    style: t.Optional(
      t.Object({
        stroke: t.Optional(t.String()),
      })
    ),
    target: t.String(),
    type: t.Optional(t.String()),
  })

  export const GraphDataSchema = t.Object({
    clients: t.Array(
      t.Object({
        id: t.Number(),
        initialized: t.Boolean(),
        name: t.String(),
      })
    ),
    containers: t.Array(t.Any()),
    dockNodes: t.Array(
      t.Object({
        hostname: t.String(),
        id: t.Number(),
        name: t.String(),
        port: t.Number(),
        reachable: t.Union([
          t.Literal("OK"),
          t.Literal("NO"),
          t.Literal("DockNode not initialised"),
        ]),
      })
    ),
    edges: t.Array(GraphEdgeSchema),
    hosts: t.Array(
      t.Object({
        clientId: t.Number(),
        id: t.Number(),
        name: t.String(),
        reachable: t.Boolean(),
      })
    ),
    nodes: t.Array(GraphNodeSchema),
  })
}
