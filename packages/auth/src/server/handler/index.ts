import type Logger from "@dockstat/logger"
import type DB from "@dockstat/sqlite-wrapper"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import { createAuthTables } from "../db"
import type {
  ApiTokensTable,
  OidcProvidersTable,
  UserOidcIdentitiesTable,
  UserTable,
} from "../db/types"

export class AuthHandler {
  private Logger: Logger
  private tables: {
    UsersTable: QueryBuilder<UserTable>
    APITokensTable: QueryBuilder<ApiTokensTable>
    OIDCProvidersTable: QueryBuilder<OidcProvidersTable>
    OIDCIdentitiesTable: QueryBuilder<UserOidcIdentitiesTable>
  }

  constructor(db: DB, logger: Logger) {
    this.Logger = logger.spawn("Auth")
    this.tables = createAuthTables(db, logger)
  }
}
