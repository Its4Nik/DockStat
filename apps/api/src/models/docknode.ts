import { t } from "elysia"

export namespace DockNodeModel {
  export const dockNode_registryTable = t.Object({
    id: t.Integer(),
    name: t.String({ minLength: 5 }),
    host: t.String({ minLength: 5 }),
    port: t.Number(),
    useSSL: t.Boolean(),
    timeout: t.Number(),
    keys: t.Unknown(),
  })

  export const createBody = t.Omit(
    t.Omit(dockNode_registryTable, t.Literal("keys")),
    t.Literal("id")
  )

  export const deleteBody = t.Object({
    id: t.Number(),
  })
}
