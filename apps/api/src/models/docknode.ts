import { t } from "elysia"

export namespace DockNodeModel {
  export const dockNode_registryTable = t.Object({
    host: t.String({ minLength: 5 }),
    id: t.Integer(),
    keys: t.Unknown(),
    name: t.String({ minLength: 5 }),
    port: t.Number(),
    timeout: t.Number(),
    useSSL: t.Boolean(),
  })

  export const createBody = t.Omit(
    t.Omit(dockNode_registryTable, t.Literal("keys")),
    t.Literal("id")
  )

  export const deleteBody = t.Object({
    id: t.Number(),
  })
}
