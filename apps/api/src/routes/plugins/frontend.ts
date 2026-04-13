import Elysia, { t } from "elysia"
import { PluginModel } from "../../models/plugins"
import PluginHandler from "../../plugins"

const DockStatAPIFrontendPluginRoutes = new Elysia({
  detail: { tags: ["Frontend"] },
  prefix: "/frontend",
})
  .get(
    "/routes",
    ({ status }) => {
      const data: typeof PluginModel.pathItems.static = {} as typeof PluginModel.pathItems.static

      for (const route of PluginHandler.getAllFrontendRoutes()) {
        data[route.pluginName] = {
          paths: [
            ...((data[route.pluginName] || { paths: [] }).paths || []),
            { fullPath: route.fullPath, metaTitle: route.meta?.title || "Unknown" },
          ],
          pluginName: route.pluginName,
        }
      }

      return status(200, Object.values(data))
    },
    {
      detail: {
        description: "Get all frontend routes from loaded plugins",
      },
      response: {
        200: t.Array(PluginModel.singlePathItem),
      },
    }
  )
  .get("/routes/by-plugin", () => PluginHandler.getFrontendRoutesByPlugin(), {
    detail: {
      description: "Get frontend routes grouped by plugin",
    },
  })
  .get("/navigation", () => PluginHandler.getFrontendNavigationItems(), {
    detail: {
      description: "Get navigation items for plugins with frontend routes",
    },
  })
  .get("/summary", () => PluginHandler.getFrontendSummary(), {
    detail: {
      description: "Get summary of all frontend configurations",
    },
  })
  .post(
    "/:pluginId/template",
    async ({ params, body }) => {
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

      // Get loaders and actions for this route
      const loaders = PluginHandler.getRouteLoaders(pluginId, routePath)
      const actions = PluginHandler.getRouteActions(pluginId, routePath)

      // Execute loaders to get initial data
      const {
        results: loaderResults,
        state: loadedState,
        data: loadedData,
      } = await PluginHandler.executeRouteLoaders(pluginId, routePath)

      return {
        actions,
        fragments,
        initialData: {
          data: loadedData,
          loaderResults,
          state: loadedState,
        },
        loaders,
        route,
        template,
      }
    },
    {
      body: t.Object({
        path: t.String(),
      }),
      detail: {
        description: "Get the template for a specific plugin frontend route with initial data",
      },
      params: t.Object({
        pluginId: t.String(),
      }),
    }
  )
  .get(
    "/:pluginId/has-routes",
    ({ params }) => ({
      hasFrontendRoutes: PluginHandler.hasFrontendRoutes(Number(params.pluginId)),
      pluginId: Number(params.pluginId),
    }),
    {
      detail: {
        description: "Check if a plugin has any frontend routes",
      },
      params: t.Object({
        pluginId: t.String(),
      }),
    }
  )
  // ==================== Frontend Loaders Endpoints ====================
  .get(
    "/:pluginId/loaders",
    ({ params, query }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${query.path || ""}`

      return {
        loaders: PluginHandler.getRouteLoaders(pluginId, routePath),
        pluginId,
        routePath,
      }
    },
    {
      detail: {
        description: "Get all loaders for a plugin route",
      },
      params: t.Object({
        pluginId: t.String(),
      }),
      query: t.Object({
        path: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/:pluginId/loaders/execute",
    async ({ params, body }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${body.path || ""}`

      const { results, state, data } = await PluginHandler.executeRouteLoaders(
        pluginId,
        routePath,
        { state: body.state }
      )

      return {
        data,
        pluginId,
        results,
        routePath,
        state,
      }
    },
    {
      body: t.Object({
        path: t.String(),
        state: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      detail: {
        description: "Execute all loaders for a plugin route",
      },
      params: t.Object({
        pluginId: t.String(),
      }),
    }
  )
  .post(
    "/:pluginId/loaders/:loaderId/execute",
    async ({ params, body }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${body.path || ""}`

      const result = await PluginHandler.executeLoader(pluginId, routePath, params.loaderId, {
        state: body.state,
      })

      if (!result) {
        return {
          error: "Loader not found",
          loaderId: params.loaderId,
          pluginId,
          routePath,
        }
      }

      return {
        loaderId: params.loaderId,
        pluginId,
        result,
        routePath,
      }
    },
    {
      body: t.Object({
        path: t.String(),
        state: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      detail: {
        description: "Execute a specific loader by ID",
      },
      params: t.Object({
        loaderId: t.String(),
        pluginId: t.String(),
      }),
    }
  )
  // ==================== Frontend Actions Endpoints ====================
  .get(
    "/:pluginId/actions",
    ({ params, query }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${query.path || ""}`

      return {
        actions: PluginHandler.getRouteActions(pluginId, routePath),
        pluginId,
        routePath,
      }
    },
    {
      detail: {
        description: "Get all actions for a plugin route",
      },
      params: t.Object({
        pluginId: t.String(),
      }),
      query: t.Object({
        path: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/:pluginId/actions/:actionId/execute",
    async ({ params, body }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${body.path || ""}`

      const result = await PluginHandler.executeAction(pluginId, routePath, params.actionId, {
        payload: body.payload,
        state: body.state,
      })

      if (!result) {
        return {
          actionId: params.actionId,
          error: "Action not found",
          pluginId,
          routePath,
        }
      }

      return {
        actionId: params.actionId,
        pluginId,
        result,
        routePath,
      }
    },
    {
      body: t.Object({
        path: t.String(),
        payload: t.Optional(t.Unknown()),
        state: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      detail: {
        description: "Execute a frontend action by ID",
      },
      params: t.Object({
        actionId: t.String(),
        pluginId: t.String(),
      }),
    }
  )
  .get(
    "/:pluginId/actions/:actionId",
    ({ params, query }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${query.path || ""}`

      const action = PluginHandler.getAction(pluginId, routePath, params.actionId)

      if (!action) {
        return {
          actionId: params.actionId,
          error: "Action not found",
          pluginId,
          routePath,
        }
      }

      return {
        action,
        pluginId,
        routePath,
      }
    },
    {
      detail: {
        description: "Get a specific action definition by ID",
      },
      params: t.Object({
        actionId: t.String(),
        pluginId: t.String(),
      }),
      query: t.Object({
        path: t.Optional(t.String()),
      }),
    }
  )

export default DockStatAPIFrontendPluginRoutes
