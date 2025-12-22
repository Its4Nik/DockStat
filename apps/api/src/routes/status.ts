import Elysia from "elysia"
import { DockStatDB } from "../database"
import DCM from "../docker"
import BaseLogger from "../logger"
import PluginHandler from "../plugins"

interface ServiceStatus {
  name: string
  initialized: boolean
  details?: Record<string, unknown>
}

const StatusRoutes = new Elysia({
  detail: {
    tags: ["Misc"],
  },
}).get("/status", async () => {
  const services: ServiceStatus[] = []

  services.push({
    name: "Database",
    initialized: !!DockStatDB._sqliteWrapper,
    details: {
      path: DockStatDB._dbPath,
      hasConfigTable: !!DockStatDB.configTable,
      hasMetricsTable: !!DockStatDB.metricsTable,
    },
  })

  services.push({
    name: "Logger",
    initialized: !!BaseLogger,
    details: {
      available: true,
    },
  })

  const pluginStatus = PluginHandler.getStatus()
  services.push({
    name: "PluginHandler",
    initialized: !!PluginHandler,
    details: {
      ...pluginStatus,
      totalPlugins: PluginHandler.getAll().length,
      registeredHooks: Array.from(PluginHandler.getHookHandlers()).length,
      registeredRoutes: PluginHandler.getAllPluginRoutes().length,
    },
  })

  const dcmStatus = await DCM.getStatus()
  services.push({
    name: "DockerClientManager",
    initialized: !!DCM,
    details: {
      ...dcmStatus,
    },
  })

  const allInitialized = services.every((s) => s.initialized)

  return {
    status: allInitialized ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services,
  }
})

export default StatusRoutes
