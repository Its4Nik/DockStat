import DBFactory from "@dockstat/db"
import type DB from "@dockstat/sqlite-wrapper"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { CertificateTypeRow, DockStatConfigTableType, RepoType } from "@dockstat/typings/types"
import { BaseLogger } from "../logger"

const InitDBLogger = BaseLogger.spawn("DBInit")

const InitialDockStatDB = new DBFactory(BaseLogger)

InitDBLogger.info(`Opening database: path=${InitialDockStatDB.getDatabasePath()}`)

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
  repositoriesTable: InitialDockStatDB.getRepositoriesTable(),
  metricsTable: InitialDockStatDB.getMetricsTable(),
}

InitDBLogger.info(
  `Database singleton ready: tables=[config, repositories, certificates, metrics]`
)

process.on("SIGINT", () => {
  BaseLogger.info("Shutting down (SIGINT)...")
  InitialDockStatDB.close()
  process.exit(0)
})

process.on("SIGTERM", () => {
  BaseLogger.info("Shutting down (SIGTERM)...")
  InitialDockStatDB.close()
  process.exit(0)
})

export { DockStatDB }
