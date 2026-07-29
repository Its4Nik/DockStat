/**
 * Database manager for the widgets subsystem.
 *
 * Creates the required tables (widgets, dashboards) and exposes
 * typed store instances.  Designed to be instantiated once and
 * shared across the application.
 */

import type { Logger } from "@dockstat/logger"
import type { DB } from "@dockstat/sqlite-wrapper"
import type { DashboardDefinition, WidgetDefinition } from "../types"
import { DashboardsStore } from "./dashboards-store"
import { dashboardsColumns, widgetsColumns } from "./schema"
import { WidgetsStore } from "./widgets-store"

export class WidgetsDatabase {
  private db: DB
  private log: Logger

  public widgets: WidgetsStore
  public dashboards: DashboardsStore

  constructor(db: DB, baseLogger: Logger) {
    this.db = db
    this.log = baseLogger.spawn("WidgetsDB")

    this.log.info("Initializing widgets database tables")

    const widgetsTable = db.createTable("widgets", widgetsColumns as any, {
      ifNotExists: true,
      parser: {
        BOOLEAN: [],
        JSON: ["defaultConfig", "configSchema", "dataInputs", "dataOutputs"],
      },
    })

    const dashboardsTable = db.createTable("dashboards", dashboardsColumns as any, {
      ifNotExists: true,
      parser: {
        BOOLEAN: ["isDefault"],
        JSON: ["widgets", "layouts", "dataPipe"],
      },
    })

    this.widgets = new WidgetsStore(widgetsTable)
    this.dashboards = new DashboardsStore(dashboardsTable)

    this.log.info("Widgets database tables ready")
  }
}
