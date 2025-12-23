import Elysia, { t } from "elysia"
import { PluginModel } from "../../models/plugins"
import PluginHandler from "../../plugins"

const PluginRoutes = new Elysia({
  prefix: "/plugins",
  detail: {
    tags: ["Plugins"],
  },
})
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
  // Frontend route endpoints
  .get("/frontend/routes", () => PluginHandler.getAllFrontendRoutes(), {
    detail: {
      description: "Get all frontend routes from loaded plugins",
    },
  })
  .get("/frontend/routes/by-plugin", () => PluginHandler.getFrontendRoutesByPlugin(), {
    detail: {
      description: "Get frontend routes grouped by plugin",
    },
  })
  .get("/frontend/navigation", () => PluginHandler.getFrontendNavigationItems(), {
    detail: {
      description: "Get navigation items for plugins with frontend routes",
    },
  })
  .get("/frontend/summary", () => PluginHandler.getFrontendSummary(), {
    detail: {
      description: "Get summary of all frontend configurations",
    },
  })
  .put(
    "/frontend/:pluginId/template",
    ({ params, body }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${body.path || ""}`

      const route = PluginHandler.getFrontendRoute(pluginId, routePath)
      if (!route) {
        return {
          error: "Route not found",
          pluginId,
          routePath,
        }
      }

      const template = PluginHandler.getFrontendTemplate(pluginId, routePath)
      const fragments = PluginHandler.getSharedFragments(pluginId)

      return {
        route,
        template,
        fragments,
      }
    },
    {
      params: t.Object({
        pluginId: t.String(),
      }),
      body: t.Object({
        path: t.String(),
      }),
      detail: {
        description: "Get the template for a specific plugin frontend route",
      },
    }
  )
  .get(
    "/frontend/:pluginId/has-routes",
    ({ params }) => ({
      pluginId: Number(params.pluginId),
      hasFrontendRoutes: PluginHandler.hasFrontendRoutes(Number(params.pluginId)),
    }),
    {
      params: t.Object({
        pluginId: t.String(),
      }),
      detail: {
        description: "Check if a plugin has any frontend routes",
      },
    }
  )
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
