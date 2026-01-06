import Elysia, { t } from "elysia"
import { PluginModel } from "../../models/plugins"
import PluginHandler from "../../plugins"
import DockStatAPIFrontendPluginRoutes from "./frontend"

const PluginRoutes = new Elysia({
  prefix: "/plugins",
  detail: {
    tags: ["Plugins"],
  },
})
  .use(DockStatAPIFrontendPluginRoutes)
  .get("/all", () => PluginHandler.getAll())
  .get("/hooks", () => {
    const handlers = PluginHandler.getHookHandlers()
    const hooksArray: { pluginId: number; hooks: string[] }[] = []

    for (const [pluginId, hooks] of handlers.entries()) {
      const hookList = Object.keys(hooks)
      hooksArray.push({
        pluginId: Number(pluginId),
        hooks: hookList,
      })
    }

    return hooksArray
  })
  .get("/status", () => PluginHandler.getStatus())
  .post("/install", ({ body }) => PluginHandler.savePlugin(body), {
    body: PluginModel.installPluginBody,
  })
  .post(
    "/loadPlugins",
    async ({ body, status }) => status(200, await PluginHandler.loadPlugins(body)),
    {
      body: PluginModel.activatePluginBody,
      responses: { 200: PluginModel.activatePluginRes },
    }
  )
  .post(
    "/unloadPlugins",
    async ({ status, body }) => status(200, await PluginHandler.unloadPlugins(body.ids)),
    { body: t.Object({ ids: t.Array(t.Number()) }) }
  )
  .post("/delete", ({ body }) => PluginHandler.deletePlugin(body.pluginId), {
    body: PluginModel.deletePluginBody,
  })
  .get("/routes", () => PluginHandler.getAllPluginRoutes())

export default PluginRoutes
