import Logger from "@dockstat/logger"
import { column, DB } from "@dockstat/sqlite-wrapper"
import type { Plugin, PluginVersion, Repository, Verification } from "./types"

const logger = new Logger("Verification-DB")

/**
 * Initialize the verification database
 */
export function initDatabase(dbPath: string = "verification.db") {
  logger.info(`Initializing verification database at ${dbPath}`)

  const db = new DB(dbPath, {
    pragmas: [
      ["journal_mode", "WAL"],
      ["foreign_keys", "ON"],
      ["synchronous", "NORMAL"],
    ],
  })

  // Create repositories table
  db.createTable<Repository>(
    "repositories",
    {
      id: column.id(),
      name: column.text({ notNull: true, unique: true }),
      url: column.text({ notNull: true }),
      enabled: column.boolean({ notNull: true, default: 1 }),
      created_at: column.createdAt(),
      updated_at: column.updatedAt(),
    },
    { ifNotExists: true }
  )

  // Create plugins table
  db.createTable<Plugin>(
    "plugins",
    {
      id: column.id(),
      repository_id: column.foreignKey("repositories", "id", {
        notNull: true,
        onDelete: "CASCADE",
      }),
      name: column.text({ notNull: true }),
      description: column.text({ notNull: true }),
      author_name: column.text({ notNull: true }),
      author_email: column.text(),
      author_website: column.text(),
      license: column.text({ notNull: true, default: "MIT" }),
      repository_url: column.text({ notNull: true }),
      repo_type: column.enum(["github", "gitlab", "http"]),
      manifest_path: column.text({ notNull: true }),
      created_at: column.createdAt(),
      updated_at: column.updatedAt(),
    },
    {
      ifNotExists: true,
      constraints: {
        unique: [["repository_id", "name"]],
      },
    }
  )

  // Create plugin_versions table
  db.createTable<PluginVersion>(
    "plugin_versions",
    {
      id: column.id(),
      plugin_id: column.foreignKey("plugins", "id", {
        notNull: true,
        onDelete: "CASCADE",
      }),
      version: column.text({ notNull: true }),
      hash: column.text({ notNull: true }),
      bundle_hash: column.text(),
      tags: column.json(),
      created_at: column.createdAt(),
    },
    {
      ifNotExists: true,
      constraints: {
        unique: ["plugin_id", "version"],
      },
    }
  )

  // Create verifications table
  db.createTable<Verification>(
    "verifications",
    {
      id: column.id(),
      plugin_version_id: column.foreignKey("plugin_versions", "id", {
        notNull: true,
        onDelete: "CASCADE",
        unique: true,
      }),
      verified: column.boolean({ notNull: true, default: 0 }),
      verified_by: column.text({ notNull: true }),
      verified_at: column.timestamp(),
      notes: column.text(),
      security_status: column.enum(["safe", "unsafe", "unknown"], {
        notNull: true,
        default: "unknown",
      }),
    },
    { ifNotExists: true }
  )

  // Create indexes for common queries
  db.createIndex("idx_plugins_repository", "plugins", ["repository_id"], {
    ifNotExists: true,
  })
  db.createIndex("idx_versions_plugin", "plugin_versions", ["plugin_id"], {
    ifNotExists: true,
  })
  db.createIndex("idx_verifications_version", "verifications", ["plugin_version_id"], {
    ifNotExists: true,
  })
  db.createIndex("idx_versions_hash", "plugin_versions", ["hash"], {
    ifNotExists: true,
  })

  logger.info("Database schema initialized successfully")

  return db
}

/**
 * Get repository table accessor
 */
export function getRepositoryTable(db: DB) {
  return db.table<Repository>("repositories", {
    BOOLEAN: ["enabled"],
  })
}

/**
 * Get plugins table accessor
 */
export function getPluginsTable(db: DB) {
  return db.table<Plugin>("plugins", {})
}

/**
 * Get plugin versions table accessor
 */
export function getPluginVersionsTable(db: DB) {
  return db.table<PluginVersion>("plugin_versions", {
    JSON: ["tags"],
  })
}

/**
 * Get verifications table accessor
 */
export function getVerificationsTable(db: DB) {
  return db.table<Verification>("verifications", {
    BOOLEAN: ["verified"],
  })
}

export type { Repository, Plugin, PluginVersion, Verification }
