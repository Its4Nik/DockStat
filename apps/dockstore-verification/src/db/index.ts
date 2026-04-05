import { column, DB } from "@dockstat/sqlite-wrapper"
import BaseLogger from "../base-logger"
import type { Plugin, PluginVersion, Repository, Verification } from "./types"

const logger = BaseLogger.spawn("Verification-DB")

// Configuration
const DB_PATH = process.env.VERIFICATION_DB_PATH || "verification.db"

logger.info(`Initializing verification database at ${DB_PATH}`)

/**
 * Database instance - initialized once at module load
 */
export const db = new DB(
  DB_PATH,
  {
    pragmas: [
      ["journal_mode", "WAL"],
      ["foreign_keys", "ON"],
      ["synchronous", "NORMAL"],
    ],
  },
  logger
)

// Create repositories table
db.createTable<Repository>(
  "repositories",
  {
    created_at: column.createdAt(),
    enabled: column.boolean({ default: 1, notNull: true }),
    id: column.id(),
    name: column.text({ notNull: true, unique: true }),
    updated_at: column.updatedAt(),
    url: column.text({ notNull: true }),
  },
  { ifNotExists: true }
)

// Create plugins table
db.createTable<Plugin>(
  "plugins",
  {
    author_email: column.text(),
    author_name: column.text({ notNull: true }),
    author_website: column.text(),
    created_at: column.createdAt(),
    description: column.text({ notNull: true }),
    id: column.id(),
    license: column.text({ default: "MIT", notNull: true }),
    manifest_path: column.text({ notNull: true }),
    name: column.text({ notNull: true }),
    repo_type: column.enum(["github", "gitlab", "http"]),
    repository_id: column.foreignKey("repositories", "id", {
      notNull: true,
      onDelete: "CASCADE",
    }),
    repository_url: column.text({ notNull: true }),
    updated_at: column.updatedAt(),
  },
  {
    constraints: {
      unique: [["repository_id", "name"]],
    },
    ifNotExists: true,
  }
)

// Create plugin_versions table
db.createTable<PluginVersion>(
  "plugin_versions",
  {
    bundle_hash: column.text(),
    created_at: column.createdAt(),
    hash: column.text({ notNull: true }),
    id: column.id(),
    plugin_id: column.foreignKey("plugins", "id", {
      notNull: true,
      onDelete: "CASCADE",
    }),
    tags: column.json(),
    version: column.text({ notNull: true }),
  },
  {
    constraints: {
      unique: ["plugin_id", "version"],
    },
    ifNotExists: true,
  }
)

// Create verifications table
db.createTable<Verification>(
  "verifications",
  {
    id: column.id(),
    notes: column.text(),
    plugin_version_id: column.foreignKey("plugin_versions", "id", {
      notNull: true,
      onDelete: "CASCADE",
      unique: true,
    }),
    security_status: column.enum(["safe", "unsafe", "unknown"], {
      default: "unknown",
      notNull: true,
    }),
    verified: column.boolean({ default: 0, notNull: true }),
    verified_at: column.timestamp(),
    verified_by: column.text({ notNull: true }),
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

/**
 * Table accessors - created once and reused
 */
export const repositoriesTable = db.table<Repository>("repositories", {
  BOOLEAN: ["enabled"],
})

export const pluginsTable = db.table<Plugin>("plugins", {})

export const pluginVersionsTable = db.table<PluginVersion>("plugin_versions", {
  JSON: ["tags"],
})

export const verificationsTable = db.table<Verification>("verifications", {
  BOOLEAN: ["verified"],
})

export type { Repository, Plugin, PluginVersion, Verification }
