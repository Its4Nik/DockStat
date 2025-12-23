import Elysia, { t } from "elysia"
import PluginHandler from "../../plugins"

const DockStatAPIFrontendPluginRoutes = new Elysia({
  detail: { tags: ["Plugin", "Frontend"] },
  prefix: "/frontend",
})
  .get("/routes", () => PluginHandler.getAllFrontendRoutes(), {
    detail: {
      description: "Get all frontend routes from loaded plugins",
    },
  })
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
        route,
        template,
        fragments,
        loaders,
        actions,
        initialData: {
          loaderResults,
          state: loadedState,
          data: loadedData,
        },
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
        description: "Get the template for a specific plugin frontend route with initial data",
      },
    }
  )
  .get(
    "/:pluginId/has-routes",
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
  // ==================== Frontend Loaders Endpoints ====================
  .get(
    "/:pluginId/loaders",
    ({ params, query }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${query.path || ""}`

      return {
        pluginId,
        routePath,
        loaders: PluginHandler.getRouteLoaders(pluginId, routePath),
      }
    },
    {
      params: t.Object({
        pluginId: t.String(),
      }),
      query: t.Object({
        path: t.Optional(t.String()),
      }),
      detail: {
        description: "Get all loaders for a plugin route",
      },
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
        pluginId,
        routePath,
        results,
        state,
        data,
      }
    },
    {
      params: t.Object({
        pluginId: t.String(),
      }),
      body: t.Object({
        path: t.String(),
        state: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      detail: {
        description: "Execute all loaders for a plugin route",
      },
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
          pluginId,
          routePath,
          loaderId: params.loaderId,
        }
      }

      return {
        pluginId,
        routePath,
        loaderId: params.loaderId,
        result,
      }
    },
    {
      params: t.Object({
        pluginId: t.String(),
        loaderId: t.String(),
      }),
      body: t.Object({
        path: t.String(),
        state: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      detail: {
        description: "Execute a specific loader by ID",
      },
    }
  )
  // ==================== Frontend Actions Endpoints ====================
  .get(
    "/:pluginId/actions",
    ({ params, query }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${query.path || ""}`

      return {
        pluginId,
        routePath,
        actions: PluginHandler.getRouteActions(pluginId, routePath),
      }
    },
    {
      params: t.Object({
        pluginId: t.String(),
      }),
      query: t.Object({
        path: t.Optional(t.String()),
      }),
      detail: {
        description: "Get all actions for a plugin route",
      },
    }
  )
  .post(
    "/:pluginId/actions/:actionId/execute",
    async ({ params, body }) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${body.path || ""}`

      const result = await PluginHandler.executeAction(pluginId, routePath, params.actionId, {
        state: body.state,
        payload: body.payload,
      })

      if (!result) {
        return {
          error: "Action not found",
          pluginId,
          routePath,
          actionId: params.actionId,
        }
      }

      return {
        pluginId,
        routePath,
        actionId: params.actionId,
        result,
      }
    },
    {
      params: t.Object({
        pluginId: t.String(),
        actionId: t.String(),
      }),
      body: t.Object({
        path: t.String(),
        state: t.Optional(t.Record(t.String(), t.Unknown())),
        payload: t.Optional(t.Unknown()),
      }),
      detail: {
        description: "Execute a frontend action by ID",
      },
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
          error: "Action not found",
          pluginId,
          routePath,
          actionId: params.actionId,
        }
      }

      return {
        pluginId,
        routePath,
        action,
      }
    },
    {
      params: t.Object({
        pluginId: t.String(),
        actionId: t.String(),
      }),
      query: t.Object({
        path: t.Optional(t.String()),
      }),
      detail: {
        description: "Get a specific action definition by ID",
      },
    }
  )

export default DockStatAPIFrontendPluginRoutes
