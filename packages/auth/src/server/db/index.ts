import type Logger from "@dockstat/logger"
import type DB from "@dockstat/sqlite-wrapper"
import { column } from "@dockstat/sqlite-wrapper"
import type {
  ApiTokensTable,
  OidcProvidersTable,
  UserOidcIdentitiesTable,
  UserTable,
} from "./types"

export const createAuthTables = (db: DB, logger: Logger) => {
  logger.info("Creating Auth Tables")
  try {
    logger.debug("Create users table")
    const UsersTable = db.createTable<UserTable>(
      "users",
      {
        createdAt: column.createdAt(),
        id: column.uuid(),
        passwordHash: column.text(),
        role: column.enum(["user", "admin", "viewer"]),
        username: column.text(),
      },
      { ifNotExists: true }
    )

    logger.debug("Create api_tokens table")
    const APITokensTable = db.createTable<ApiTokensTable>(
      "api_tokens",
      {
        createdAt: column.createdAt(),
        expiresAt: column.date(),
        id: column.uuid(),
        name: column.text(),
        tokenHash: column.text(),
        userId: column.foreignKey("users", "id", { onDelete: "CASCADE" }),
      },
      { ifNotExists: true }
    )

    logger.debug("Create oidc_providers table")
    const OIDCProvidersTable = db.createTable<OidcProvidersTable>(
      "oidc_providers",
      {
        clientId: column.text(),
        clientSecret: column.text(),
        createdAt: column.createdAt(),
        enabled: column.boolean(),
        id: column.uuid(),
        issuerUrl: column.text(),
        name: column.text(),
        scope: column.text({ default: "OpenID profile email" }),
      },
      { ifNotExists: true }
    )

    logger.debug("Create oidc_identities table")
    const OIDCIdentitiesTable = db.createTable<UserOidcIdentitiesTable>(
      "oidc_identities",
      {
        createdAt: column.createdAt(),
        id: column.text(),
        providerId: column.foreignKey("oidc_providers", "id", { onDelete: "CASCADE" }),
        subject: column.text({ notNull: true }),
        userId: column.foreignKey("users", "id", { onDelete: "CASCADE" }),
      },
      { constraints: { unique: ["userId", "providerId", "subject"] }, ifNotExists: true }
    )

    logger.debug("Creating indexes")
    db.createIndex("idx_api_tokens_token_hash", "api_tokens", "tokenHash")
    db.createIndex("idx_user_oidc_identities_provider", "oidc_identities", [
      "providerId",
      "subject",
    ])

    return {
      APITokensTable,
      OIDCIdentitiesTable,
      OIDCProvidersTable,
      UsersTable,
    }
  } catch (error) {
    logger.error("Could not create Auth Tables!")
    throw new Error(String(error))
  }
}
