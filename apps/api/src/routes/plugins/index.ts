import Elysia from "elysia"
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
    return Array.from(PluginHandler.getHookHandlers())
  })
  .get("/status", () => PluginHandler.getStatus())
  .post("/install", ({ body }) => PluginHandler.savePlugin(body), {
    body: PluginModel.installPluginBody,
  })
  .post(
    "/activate",
    async ({ body, status }) => status(200, await PluginHandler.loadPlugins(body)),
    {
      body: PluginModel.activatePluginBody,
      responses: { 200: PluginModel.activatePluginRes },
    }
  )
  .post("/delete", ({ body }) => PluginHandler.deletePlugin(body.pluginId), {
    body: PluginModel.deletePluginBody,
  })
  .get("/routes", () => PluginHandler.getAllPluginRoutes())
  // Plugin API route proxy (must be last due to wildcard)
  .all(
    "/:id/routes/*",
    async ({ request, params }) =>
      PluginHandler.handleRoute(Number(params.id), params["*"], request),
    {
      detail: {
        tags: ["Plugin Routes"],
        description:
          "This route proxies all Plugin-API requests to the specified Plugin's Elysia Instance",
      },
    }
  )

export default PluginRoutes
