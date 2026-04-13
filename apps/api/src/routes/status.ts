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
    description:
      "System health and status monitoring endpoints for checking the operational state of DockStat services including database, Docker client manager, plugins, and logger.",
    tags: ["System Status"],
  },
}).get(
  "/status",
  async () => {
    const services: ServiceStatus[] = []
    services.push({
      details: {
        hasConfigTable: !!DockStatDB.configTable,
        hasMetricsTable: !!DockStatDB.metricsTable,
        path: DockStatDB._dbPath,
      },
      initialized: !!DockStatDB._sqliteWrapper,
      name: "Database",
    })

    services.push({
      details: {
        available: true,
      },
      initialized: !!BaseLogger,
      name: "Logger",
    })

    const pluginStatus = PluginHandler.getStatus()
    services.push({
      details: {
        ...pluginStatus,
        registeredHooks: Array.from(PluginHandler.getHookHandlers()).length,
        registeredRoutes: PluginHandler.getAllPluginRoutes().length,
        totalPlugins: PluginHandler.getAll().length,
      },
      initialized: !!PluginHandler,
      name: "PluginHandler",
    })

    const dcmStatus = await DCM.getStatus()
    services.push({
      details: {
        ...dcmStatus,
      },
      initialized: !!DCM,
      name: "DockerClientManager",
    })

    const allInitialized = services.every((s) => s.initialized)

    return {
      services,
      status: allInitialized ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
    }
  },
  {
    detail: {
      description:
        "Retrieves to health and initialization status of all core DockStat services. This endpoint provides a comprehensive overview of system health including database connectivity, Docker client manager status, plugin system state, and logger availability. Use this endpoint for health checks and monitoring dashboard displays.",
      responses: {
        200: {
          description: "Successfully retrieved system status",
        },
      },
      summary: "Get System Status",
    },
    response: {
      200: t.Object({
        services: t.Array(
          t.Object({
            details: t.Optional(
              t.Record(
                t.String(),
                t.Any({
                  description: "Additional service-specific details and metrics",
                })
              )
            ),
            initialized: t.Boolean({
              description: "Whether the service is properly initialized",
              examples: [true, false],
            }),
            name: t.String({
              description: "Name of the service",
              examples: ["Database", "Logger", "PluginHandler", "DockerClientManager"],
            }),
          })
        ),
        status: t.String({
          description: "Overall system status",
          examples: ["healthy", "degraded"],
        }),
        timestamp: t.String({
          description: "ISO 8601 timestamp of status check",
          format: "date-time",
        }),
      }),
    },
  }
)

export default StatusRoutes
