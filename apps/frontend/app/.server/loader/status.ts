import { statusCache } from "../cache"
import Singletons from "../singletons"

export const StatusLoaders = {
  getSystemStatus: () =>
    statusCache.getOrComputeAsync("system-status", async () => {
      const services = [
        {
          details: { hasConfigTable: !!Singletons.DB.configTable, path: Singletons.DB._dbPath },
          initialized: !!Singletons.DB._sqliteWrapper,
          name: "Database",
        },
        { details: { available: true }, initialized: true, name: "Logger" },
        {
          details: {
            ...Singletons.Plugins.getStatus(),
            registeredHooks: Array.from(Singletons.Plugins.getHookHandlers()).length,
            registeredRoutes: Singletons.Plugins.getAllPluginRoutes().length,
            totalPlugins: Singletons.Plugins.getAll().length,
          },
          initialized: true,
          name: "PluginHandler",
        },
        {
          details: await Singletons.Docker.getStatus(),
          initialized: true,
          name: "DockerClientManager",
        },
      ]

      return {
        services,
        status: services.every((s) => s.initialized) ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
      }
    }),
}
