import { DBPluginShema } from "@dockstat/typings/schemas"
import { t } from "elysia"

export namespace PluginModel {
  export const installPluginBody = t.Omit(DBPluginShema, t.Union([t.Literal("plugin")]))

  export const activatePluginBody = t.Array(t.Number())
  export const activatePluginRes = t.Object({
    errors: t.Array(t.Number()),
    successes: t.Array(t.Number()),
  })

  export const singlePathItem = t.Object({
    pluginName: t.String(),
    paths: t.Array(t.Object({ fullPath: t.String(), metaTitle: t.String() })),
  })

  export const pathItems = t.Record(t.String(), singlePathItem)

  export const deletePluginBody = t.Object({ pluginId: t.Number() })
}
