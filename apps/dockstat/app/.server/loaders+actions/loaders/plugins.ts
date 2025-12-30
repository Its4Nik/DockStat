import { ServerAPI } from "~/.server"

export default async function PluginLoader() {
  const [Status, Hooks, ServerRoutes, FrontendRoutes] = await Promise.all([
    ServerAPI.plugins.status.get(),
    ServerAPI.plugins.hooks.get(),
    ServerAPI.plugins.routes.get(),
    ServerAPI.plugins.frontend.routes.get(),
  ])

  if (
    Status.status === 200 &&
    Hooks.status === 200 &&
    ServerRoutes.status === 200 &&
    FrontendRoutes.status === 200
  ) {
    return {
      status: Status.data || {
        installed_plugins: { count: 0, data: [] },
        repos: [],
        loaded_plugins: [],
      },
      hooks: Hooks.data || [],
      server_routes: ServerRoutes.data || [],
      frontend_routes: FrontendRoutes.data || [],
    }
  }

  return {
    status: {
      installed_plugins: { count: 0, data: [] },
      repos: [],
      loaded_plugins: [],
    },
    hooks: [],
    server_routes: [],
    frontend_routes: [],
  }
}
