import { query, type RouteArgs } from "../lib/http"
import Singletons from "../singletons"

export const PluginsLoaders = {
  Frontend: {
    getByPlugin: () => Singletons.Plugins.getFrontendRoutesByPlugin(),
    getNavigation: () => Singletons.Plugins.getFrontendNavigationItems(),
    getRouteActions: ({ params, request }: RouteArgs<{ pluginId: string }>) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${query(request).get("path") || ""}`
      return {
        actions: Singletons.Plugins.getRouteActions(pluginId, routePath),
        pluginId,
        routePath,
      }
    },
    getRouteLoaders: ({ params, request }: RouteArgs<{ pluginId: string }>) => {
      const pluginId = Number(params.pluginId)
      const routePath = `/${query(request).get("path") || ""}`
      return {
        loaders: Singletons.Plugins.getRouteLoaders(pluginId, routePath),
        pluginId,
        routePath,
      }
    },
    getRoutes: () => Singletons.Plugins.getAllFrontendRoutes(),
    getSummary: () => Singletons.Plugins.getFrontendSummary(),
  },
  getAll: () => Singletons.Plugins.getAll(),
  getHooks: () => {
    const hooksArray: { pluginId: number; hooks: string[] }[] = []
    for (const [pluginId, hooks] of Singletons.Plugins.getHookHandlers().entries()) {
      hooksArray.push({ hooks: Object.keys(hooks), pluginId: Number(pluginId) })
    }
    return hooksArray
  },
  getRoutes: () => Singletons.Plugins.getAllPluginRoutes(),
  getStatus: () => Singletons.Plugins.getStatus(),
}
