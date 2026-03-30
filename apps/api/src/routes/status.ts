import Elysia, { t } from "elysia"
import { DockStatDB } from "../database"
import DCM from "../docker"
import BaseLogger from "../logger"
import PluginHandler from "../plugins"

export interface ServiceStatus {
  name: string
  initialized: boolean
  details?: Record<string, unknown>
}

const StatusRoutes = new Elysia({
  detail: {
    tags: ["System Status"],
    description: "System health and status monitoring endpoints for checking the operational state of DockStat services including database, Docker client manager, plugins, and logger.",
  },
})
.get(
  "/status",
  async () => {
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
  },
  {
  detail: {
    summary: "Get System Status",
    description: "Retrieves to health and initialization status of all core DockStat services. This endpoint provides a comprehensive overview of system health including database connectivity, Docker client manager status, plugin system state, and logger availability. Use this endpoint for health checks and monitoring dashboard displays.",
    responses: {
      200: {
        description: "Successfully retrieved system status",
      },
    },
  },
  response: {
      200: t.Object({
        status: t.String({
          description: "Overall system status",
          examples: ["healthy", "degraded"],
        }),
        timestamp: t.String({
          format: "date-time",
          description: "ISO 8601 timestamp of status check",
        }),
        services: t.Array(
          t.Object({
            name: t.String({
              description: "Name of the service",
              examples: ["Database", "Logger", "PluginHandler", "DockerClientManager"],
            }),
            initialized: t.Boolean({
              description: "Whether the service is properly initialized",
              examples: [true, false],
            }),
            details: t.Optional(
              t.Record(t.String(), t.Any({
                description: "Additional service-specific details and metrics",
              }))
            ),
          })
        ),
      })
    }
})

export default StatusRoutes
