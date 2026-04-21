import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import { ConfigService } from "./config"
import {
  type AuthContext,
  type AuthUser,
  type AuthWsContext,
  authenticated,
  createAuthenticatedWsHandler,
  createAuthMiddleware,
  getWsUser,
  handleWsAuthentication,
  isAuthenticatedUser,
  type JWTPayload,
  requireAuth,
  verifyWsToken,
  withAuth,
} from "./middleware"
import { createAuthRoutes } from "./routes"
import type { ProvidersTable } from "./types"

export class AuthHandler {
  table: QueryBuilder<ProvidersTable>
  logger: Logger
  configService: ConfigService
  routes: ReturnType<typeof createAuthRoutes>

  constructor(db: DB, logger: Logger) {
    this.logger = logger.spawn("Auth")

    this.logger.info("Initializing Auth Service")

    this.table = db.createTable<ProvidersTable>(
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

    this.configService = new ConfigService(this.table, this.logger)

    this.routes = createAuthRoutes(this.table, this.logger, this.configService)
  }
}

export {
  authenticated,
  createAuthMiddleware,
  createAuthenticatedWsHandler,
  handleWsAuthentication,
  isAuthenticatedUser,
  requireAuth,
  verifyWsToken,
  withAuth,
  getWsUser,
}
export type { AuthContext, AuthUser, AuthWsContext, JWTPayload }
