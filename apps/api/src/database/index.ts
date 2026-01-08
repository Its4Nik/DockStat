import DBFactory from "@dockstat/db"
import type DB from "@dockstat/sqlite-wrapper"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockStatConfigTableType, RepoType } from "@dockstat/typings/types"
import BaseLogger from "../logger"

const InitialDockStatDB = new DBFactory("DB", BaseLogger)

export const DockStatDB: {
  _sqliteWrapper: DB
  _dbPath: string
  configTable: QueryBuilder<DockStatConfigTableType>
  repositoriesTable: QueryBuilder<RepoType>
  metricsTable: unknown
} = {
  _sqliteWrapper: InitialDockStatDB.getDB(),
  _dbPath: InitialDockStatDB.getDatabasePath(),
  configTable: InitialDockStatDB.getConfigTable(),
  repositoriesTable: InitialDockStatDB.getRepositoriesTable(),
  metricsTable: InitialDockStatDB.getMetricsTable(),
}

process.on("SIGINT", () => {
  BaseLogger.info("Shutting down...")
  InitialDockStatDB.close()
  process.exit(0)
})

process.on("SIGTERM", () => {
  BaseLogger.info("Shutting down...")
  InitialDockStatDB.close()
  process.exit(0)
})
