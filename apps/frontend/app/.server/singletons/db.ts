import DBFactory from "@dockstat/db"
import type DB from "@dockstat/sqlite-wrapper"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { CertificateTypeRow, DockStatConfigTableType, RepoType } from "@dockstat/typings/types"
import { BaseLogger } from "../logger"

const InitialDockStatDB = new DBFactory(BaseLogger)

const DockStatDB: {
  _sqliteWrapper: DB
  _dbPath: string
  certificatesTable: QueryBuilder<CertificateTypeRow>
  configTable: QueryBuilder<DockStatConfigTableType>
  repositoriesTable: QueryBuilder<RepoType>
  metricsTable: unknown
} = {
  _dbPath: InitialDockStatDB.getDatabasePath(),
  _sqliteWrapper: InitialDockStatDB.getDB(),
  certificatesTable: InitialDockStatDB.getCertificatesTable(),
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

export { DockStatDB }
