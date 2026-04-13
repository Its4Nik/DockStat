import { column } from "@dockstat/sqlite-wrapper"
import { DockStatDB } from "../../database"
import BaseLogger from "../../logger"

const logger = BaseLogger.spawn("BetterAuthDB")

/**
 * Initialize Better Auth tables in the database
 * This creates all required tables for Better Auth core functionality,
 * admin plugin, and API Key plugin
 */
export function initializeBetterAuthTables() {
  const db = DockStatDB._sqliteWrapper

  logger.info("Initializing Better Auth tables")

  try {
    // User table
    db.createTable(
      "user",
      {
        banExpires: column.date(),
        banned: column.boolean({ default: false }),
        banReason: column.text(),
        createdAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        email: column.text({ notNull: true }),
        emailVerified: column.boolean({ default: false }),
        id: column.text({ primaryKey: true }),
        image: column.text(),
        name: column.text({ notNull: true }),
        // Admin plugin fields
        role: column.text({ default: "user" }),
        updatedAt: column.date({ default: "CURRENT_TIMESTAMP" }),
      },
      {
        ifNotExists: true,
      }
    )
    logger.debug("User table created")

    // Session table
    db.createTable(
      "session",
      {
        createdAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        expiresAt: column.date({ notNull: true }),
        id: column.text({ primaryKey: true }),
        // Admin plugin field
        impersonatedBy: column.text(),
        ipAddress: column.text(),
        token: column.text({ notNull: true }),
        updatedAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        userAgent: column.text(),
        userId: column.text({ notNull: true }),
      },
      {
        ifNotExists: true,
      }
    )
    logger.debug("Session table created")

    // Account table
    db.createTable(
      "account",
      {
        accessToken: column.text(),
        accessTokenExpiresAt: column.date(),
        accountId: column.text({ notNull: true }),
        createdAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        id: column.text({ primaryKey: true }),
        idToken: column.text(),
        password: column.text(),
        providerId: column.text({ notNull: true }),
        refreshToken: column.text(),
        refreshTokenExpiresAt: column.date(),
        scope: column.text(),
        updatedAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        userId: column.text({ notNull: true }),
      },
      {
        ifNotExists: true,
      }
    )
    logger.debug("Account table created")

    // Verification table
    db.createTable(
      "verification",
      {
        createdAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        expiresAt: column.date({ notNull: true }),
        id: column.text({ primaryKey: true }),
        identifier: column.text({ notNull: true }),
        updatedAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        value: column.text({ notNull: true }),
      },
      {
        ifNotExists: true,
      }
    )
    logger.debug("Verification table created")

    // API Key table (from API Key plugin)
    db.createTable(
      "apikey",
      {
        configId: column.text({ default: "default" }),
        createdAt: column.date({ default: "CURRENT_TIMESTAMP" }),
        enabled: column.boolean({ default: true }),
        expiresAt: column.date(),
        id: column.text({ primaryKey: true }),
        key: column.text({ notNull: true }),
        lastRefillAt: column.date(),
        lastRequest: column.date(),
        metadata: column.json(),
        name: column.text(),
        permissions: column.json(),
        prefix: column.text(),
        rateLimitEnabled: column.boolean({ default: false }),
        rateLimitMax: column.integer(),
        rateLimitTimeWindow: column.integer(),
        referenceId: column.text({ notNull: true }),
        refillAmount: column.integer(),
        refillInterval: column.integer(),
        remaining: column.integer(),
        requestCount: column.integer({ default: 0 }),
        start: column.text(),
        updatedAt: column.date({ default: "CURRENT_TIMESTAMP" }),
      },
      {
        ifNotExists: true,
      }
    )
    logger.debug("API Key table created")

    // Create indexes for better performance
    db.createIndex("idx_session_user_id", "session", ["userId"], { ifNotExists: true })
    db.createIndex("idx_session_token", "session", ["token"], { ifNotExists: true })
    db.createIndex("idx_account_user_id", "account", ["userId"], { ifNotExists: true })
    db.createIndex("idx_account_provider_id", "account", ["providerId", "accountId"], {
      ifNotExists: true,
    })
    db.createIndex("idx_user_email", "user", ["email"], { ifNotExists: true })
    db.createIndex("idx_apikey_reference_id", "apikey", ["referenceId"], { ifNotExists: true })
    db.createIndex("idx_apikey_key", "apikey", ["key"], { ifNotExists: true })

    logger.info("Better Auth tables initialized successfully")
  } catch (error) {
    logger.error(`Failed to initialize Better Auth tables: ${error}`)
    throw error
  }
}

/**
 * Initialize Better Auth tables
 * Call this function when your application starts up
 */
export function setupBetterAuth() {
  try {
    initializeBetterAuthTables()
    logger.info("Better Auth setup completed")
  } catch (error) {
    logger.error(`Better Auth setup failed: ${error}`)
    throw error
  }
}
