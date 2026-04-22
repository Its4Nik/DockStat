import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import { ConfigService } from "./config"
import { getMiddlewareFunctions } from "./middleware"
import { createAuthRoutes } from "./routes"
import type { LocalUsersTable, ProvidersTable } from "./types"

export class AuthHandler {
  providers: QueryBuilder<ProvidersTable>
  users: QueryBuilder<LocalUsersTable>
  logger: Logger
  configService: ConfigService
  routes: ReturnType<typeof createAuthRoutes>
  middleware: ReturnType<typeof getMiddlewareFunctions>

  constructor(db: DB, logger: Logger) {
    this.logger = logger.spawn("Auth")

    this.logger.info("Initializing Auth Service")

    this.providers = db.createTable<ProvidersTable>(
      "oidc-providers",
      {
        client_id: column.text({ notNull: true }),
        client_secret: column.text({ notNull: true }),
        created_at: column.createdAt(),
        id: column.uuid({ generateDefault: true }),
        issuer_url: column.text({ notNull: true }),
        logout_url: column.text({ notNull: true }),
        scopes: column.text({ default: "openid profile email" }),
      },
      { ifNotExists: true }
    )

    this.users = db.createTable<LocalUsersTable>("users", {
      createdAt: column.createdAt(),
      id: column.uuid({ generateDefault: true }),
      name: column.text({ notNull: true, unique: true }),
      passHash: column.text({ notNull: true }),
      updatedAt: column.updatedAt(),
    })

    this.configService = new ConfigService(this.providers, this.logger)

    this.routes = createAuthRoutes(this.providers, this.users, this.logger, this.configService)

    this.middleware = getMiddlewareFunctions(this.logger)
  }
}
