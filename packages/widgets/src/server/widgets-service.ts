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

import type { Logger } from "@dockstat/logger"
import type { DB } from "@dockstat/sqlite-wrapper"
import Elysia from "elysia"
import { DataPipeEngine, WebSocketDataSourceProvider } from "./data-pipe"
import {
  AggregateTransformer,
  ArrayFilterTransformer,
  ExpressionTransformer,
  FormatTransformer,
  JsonPathTransformer,
  PassthroughTransformer,
  PickFieldsTransformer,
  SortTransformer,
  StaticProvider,
  TimeProvider,
} from "./data-pipe/builtins"
import {
  FlattenTransformer,
  GroupByTransformer,
  MapFieldsTransformer,
  PivotTransformer,
  TopNTransformer,
  WindowTransformer,
} from "./data-pipe/transforms-advanced"
import { WidgetsDatabase } from "./db"
import { DashboardImporter, WidgetImporter } from "./import"
import { DEFAULT_WIDGET_MANIFEST } from "./import/default-widgets"
import { DashboardRepository, WidgetRepository } from "./repository"
import { createDashboardRoutes, createDataPipeRoutes, createWidgetRoutes } from "./routes"
import { WidgetWSHandler } from "./ws"

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
  public readonly wsDataSource: WebSocketDataSourceProvider
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
    this.dashboardImporter = new DashboardImporter(this.dashboards, this.widgets, this.log)

    // Data-pipe engine with built-in providers & transformers
    this.engine = new DataPipeEngine(this.log)

    // WebSocket data source provider (connected later via connectWebSocketHandler)
    this.wsDataSource = new WebSocketDataSourceProvider(this.log, {})

    this.registerBuiltins()

    // WebSocket handler (with optional auth)
    this.ws = new WidgetWSHandler(this.log, {
      requireAuth: config?.requireAuth,
      verifyToken: config?.verifyToken,
    })

    this.log.info("WidgetsService initialized")
  }

  /**
   * Connect the WebSocket data source provider to an external pub/sub handler.
   * Call this after construction, passing the main DSWebSockerHandler's
   * subscribe/publish callbacks so data-pipe nodes of type "websocket-source"
   * receive live data from any registered topic.
   */
  connectDataSourceHandler(config: {
    subscribe: (topic: string, callback: (data: unknown) => void) => (() => void) | undefined
    publish?: (topic: string, data: unknown) => number
  }): void {
    this.wsDataSource.setCallbacks(config)
    this.log.info("WebSocket data source handler connected")
  }

  private registerBuiltins(): void {
    this.engine.registerProvider(new StaticProvider())
    this.engine.registerProvider(new TimeProvider())
    this.engine.registerProvider(this.wsDataSource)
    this.engine.registerTransformer(new PassthroughTransformer())
    this.engine.registerTransformer(new JsonPathTransformer())
    this.engine.registerTransformer(new ArrayFilterTransformer())
    this.engine.registerTransformer(new ExpressionTransformer())
    this.engine.registerTransformer(new AggregateTransformer())
    this.engine.registerTransformer(new SortTransformer())
    this.engine.registerTransformer(new PickFieldsTransformer())
    this.engine.registerTransformer(new FormatTransformer())
    this.engine.registerTransformer(new GroupByTransformer())
    this.engine.registerTransformer(new FlattenTransformer())
    this.engine.registerTransformer(new PivotTransformer())
    this.engine.registerTransformer(new TopNTransformer())
    this.engine.registerTransformer(new WindowTransformer())
    this.engine.registerTransformer(new MapFieldsTransformer())
    this.widgetImporter.importManifest(DEFAULT_WIDGET_MANIFEST)
  }

  // IMPORTANT: Do NOT annotate the return type of these methods.
  // The previous `ReturnType<(typeof Elysia)["prototype"]["use"]>` annotation
  // erased the specific route-map types, which propagated `any`/`{}` into every
  // app that called `.use(service.getRestRoutes())` (or getWsRoutes/getRoutes),
  // collapsing Eden Treaty's route inference to a single `~path` leaf.
  // Letting TypeScript infer the concrete Elysia type preserves Treaty safety.

  /**
   * Get the Elysia plugin with all widget REST routes.
   * These should be mounted inside an authenticated guard.
   */
  getRestRoutes() {
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
  getWsRoutes() {
    return this.ws.getRoutes()
  }

  /**
   * Get all routes (REST + WS) combined.
   * NOTE: WS routes authenticate internally via requireAuth.
   * If mounting inside an authenticated guard, prefer getRestRoutes() + getWsRoutes()
   * separately instead.
   */
  getRoutes() {
    return new Elysia().use(this.getRestRoutes()).use(this.getWsRoutes())
  }

  /**
   * Start periodic data-pipe evaluation for all dashboards.
   */
  startPollingAll(intervalMs = 5000): void {
    const dashboards = this.dashboards.list()
    for (const dashboard of dashboards) {
      this.engine.startPolling(dashboard.id, dashboard.dataPipe, intervalMs, (dashId, payloads) => {
        this.ws.sendDataUpdate(dashId, payloads)
      })
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
