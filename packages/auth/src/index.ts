import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import { ConfigService } from "./config"
import { getMiddlewareFunctions } from "./middleware"
import { createAuthRoutes } from "./routes"
import type { ApiKeysTable, LocalUsersTable, ProvidersTable } from "./types"

export class AuthHandler {
  providers: QueryBuilder<ProvidersTable>
  users: QueryBuilder<LocalUsersTable>
  apiKeys: QueryBuilder<ApiKeysTable>
  logger: Logger
  configService: ConfigService
  middleware: ReturnType<typeof getMiddlewareFunctions>
  allowGuestRegistration: boolean
  getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>

  constructor(
    db: DB,
    logger: Logger,
    getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>
  ) {
    this.logger = logger.spawn("Auth")
    this.getStateMap = getStateMap

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

    this.apiKeys = db.createTable<ApiKeysTable>("api-keys", {
      createdAt: column.createdAt(),
      expiresAt: column.datetime({ notNull: false }),
      id: column.uuid({ generateDefault: true }),
      keyHash: column.text({ notNull: true }),
      lastUsedAt: column.datetime({ notNull: false }),
      name: column.text({ notNull: true }),
      revokedAt: column.datetime({ notNull: false }),
      scopes: column.text({ default: "*" }),
      userId: column.text({ notNull: true }),
    })

    this.allowGuestRegistration = true
    if (this.users.select(["id"]).count() < 1) {
      this.allowGuestRegistration = true
    }

    this.configService = new ConfigService(this.providers, this.logger)

    this.middleware = getMiddlewareFunctions(this.logger, this.getStateMap, this.apiKeys)
  }

  getAllowGuestRegistration() {
    return this.allowGuestRegistration
  }

  setAllowGuestRegistration(enable: boolean) {
    this.allowGuestRegistration = enable
  }

  getRoutes() {
    return createAuthRoutes(
      this.providers,
      this.users,
      this.apiKeys,
      this.logger,
      this.configService,
      () => this.getAllowGuestRegistration(),
      (enable: boolean) => this.setAllowGuestRegistration(enable)
    )
  }
}
