import DBFactory from "@dockstat/db"
import type DB from "@dockstat/sqlite-wrapper"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockStatConfigTableType, RepoType } from "@dockstat/typings/types"
import { getAuthTable } from "../auth/db"
import type { AuthDB } from "../auth/types"
import BaseLogger from "../logger"

const InitialDockStatDB = new DBFactory("DB", BaseLogger)

export const DockStatDB: {
  _sqliteWrapper: DB
  _dbPath: string
  configTable: QueryBuilder<DockStatConfigTableType>
  repositoriesTable: QueryBuilder<RepoType>
  authTable: QueryBuilder<AuthDB>
  metricsTable: unknown
} = {
  _dbPath: InitialDockStatDB.getDatabasePath(),
  _sqliteWrapper: InitialDockStatDB.getDB(),
  authTable: getAuthTable(InitialDockStatDB.getDB()),
  configTable: InitialDockStatDB.getConfigTable(),
  metricsTable: InitialDockStatDB.getMetricsTable(),
  repositoriesTable: InitialDockStatDB.getRepositoriesTable(),
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
