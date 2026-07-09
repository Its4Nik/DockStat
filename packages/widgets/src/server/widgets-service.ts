/**
 * WidgetsService — the main entry point for the widgets backend.
 *
 * Wires together the database, repositories, data-pipe engine,
 * import system, WebSocket handler, and Elysia routes.
 *
 * Usage:
 * ```ts
 * import { WidgetsService } from "widgets/server"
 * const service = new WidgetsService(existingDb, logger)
 * app.use(service.getRoutes())
 * ```
 */

import Elysia from "elysia"
import type { DB } from "@dockstat/sqlite-wrapper"
import type { Logger } from "@dockstat/logger"
import { WidgetsDatabase } from "./db"
import { WidgetRepository } from "./repository"
import { DashboardRepository } from "./repository"
import { WidgetImporter } from "./import"
import { DashboardImporter } from "./import"
import { DataPipeEngine } from "./data-pipe"
import {
  ArrayFilterTransformer,
  JsonPathTransformer,
  PassthroughTransformer,
  StaticProvider,
  TimeProvider,
} from "./data-pipe/builtins"
import { WidgetWSHandler } from "./ws"
import { createWidgetRoutes } from "./routes"
import { createDashboardRoutes } from "./routes"
import { createDataPipeRoutes } from "./routes"

export interface WidgetsServiceConfig {
  /** Enable authentication for WebSocket connections */
  requireAuth?: boolean
  /** Token verification function (from @dockstat/auth) */
  verifyToken?: (token: string) => Promise<Record<string, unknown> | null>
}

export class WidgetsService {
  private db: WidgetsDatabase
  private log: Logger

  public readonly widgets: WidgetRepository
  public readonly dashboards: DashboardRepository
  public readonly engine: DataPipeEngine
  public readonly ws: WidgetWSHandler
  public readonly widgetImporter: WidgetImporter
  public readonly dashboardImporter: DashboardImporter

  constructor(db: DB, baseLogger: Logger, config?: WidgetsServiceConfig) {
    this.log = baseLogger.spawn("WidgetsService")

    // Database layer
    this.db = new WidgetsDatabase(db, baseLogger)

    // Repositories
    this.widgets = new WidgetRepository(this.db.widgets, this.log)
    this.dashboards = new DashboardRepository(this.db.dashboards, this.log)

    // Import system
    this.widgetImporter = new WidgetImporter(this.widgets, this.log)
    this.dashboardImporter = new DashboardImporter(
      this.dashboards,
      this.widgets,
      this.log
    )

    // Data-pipe engine with built-in providers & transformers
    this.engine = new DataPipeEngine(this.log)
    this.registerBuiltins()

    // WebSocket handler (with optional auth)
    this.ws = new WidgetWSHandler(this.log, {
      requireAuth: config?.requireAuth,
      verifyToken: config?.verifyToken,
    })

    this.log.info("WidgetsService initialized")
  }

  private registerBuiltins(): void {
    this.engine.registerProvider(new StaticProvider())
    this.engine.registerProvider(new TimeProvider())
    this.engine.registerTransformer(new PassthroughTransformer())
    this.engine.registerTransformer(new JsonPathTransformer())
    this.engine.registerTransformer(new ArrayFilterTransformer())
  }

  /**
   * Get the Elysia plugin with all widget REST routes.
   * These should be mounted inside an authenticated guard.
   */
  getRestRoutes(): ReturnType<typeof Elysia["prototype"]["use"]> {
    return new Elysia({ prefix: "/widgets" })
      .use(createWidgetRoutes(this.widgets, this.widgetImporter, this.log))
      .use(createDashboardRoutes(this.dashboards, this.dashboardImporter, this.log))
      .use(createDataPipeRoutes(this.engine, this.dashboards, this.ws, this.log))
  }

  /**
   * Get the WebSocket routes for widgets.
   * These must be mounted OUTSIDE any HTTP-level authenticated guard
   * because Elysia guards don't work for WS upgrade requests.
   * The WS handler authenticates connections via its own requireAuth config.
   */
  getWsRoutes(): ReturnType<typeof Elysia["prototype"]["use"]> {
    return this.ws.getRoutes()
  }

  /**
   * Get all routes (REST + WS) combined.
   * NOTE: WS routes authenticate internally via requireAuth.
   * If mounting inside an authenticated guard, prefer getRestRoutes() + getWsRoutes()
   * separately instead.
   */
  getRoutes(): ReturnType<typeof Elysia["prototype"]["use"]> {
    return new Elysia()
      .use(this.getRestRoutes())
      .use(this.getWsRoutes())
  }

  /**
   * Start periodic data-pipe evaluation for all dashboards.
   */
  startPollingAll(intervalMs = 5000): void {
    const dashboards = this.dashboards.list()
    for (const dashboard of dashboards) {
      this.engine.startPolling(
        dashboard.id,
        dashboard.dataPipe,
        intervalMs,
        (dashId, payloads) => {
          this.ws.sendDataUpdate(dashId, payloads)
        }
      )
    }
  }

  /**
   * Graceful shutdown — stops all polling intervals.
   */
  dispose(): void {
    this.engine.dispose()
    this.log.info("WidgetsService disposed")
  }
}
