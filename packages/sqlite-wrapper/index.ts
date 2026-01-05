import { Database, type SQLQueryBindings } from "bun:sqlite"
<<<<<<< HEAD
import type { Logger } from "@dockstat/logger"
import { QueryBuilder } from "./query-builder/index"
import type { ColumnDefinition, Parser, TableConstraints, TableOptions, TableSchema } from "./types"
import { createLogger, type SqliteLogger } from "./utils"
=======
import { QueryBuilder } from "./query-builder/index"
import type { ColumnDefinition, Parser, TableConstraints, TableOptions, TableSchema } from "./types"
import { addLoggerParents as addParents, createLogger, logger as sqliteLogger } from "./utils"

// Re-export logger utilities for external use
export const logger = sqliteLogger
export const addLoggerParents = addParents

// Internal loggers for different components
const dbLog = createLogger("db")
const backupLog = createLogger("backup")
const tableLog = createLogger("table")
>>>>>>> main

/**
 * Re-export all types and utilities
 */
export { QueryBuilder }
export type {
  ArrayKey,
  ColumnConstraints,
  ColumnDefinition,
  ColumnNames,
  DefaultExpression,
  DeleteResult,
  ForeignKeyAction,
  InsertOptions,
  InsertResult,
  RegexCondition,
  SQLiteType,
  TableConstraints,
  TableOptions,
  TableSchema,
  UpdateResult,
  WhereCondition,
} from "./types"

// Re-export helper utilities
export {
  column,
  defaultExpr,
  SQLiteFunctions,
  SQLiteKeywords,
  SQLiteTypes,
  sql,
} from "./types"

/**
 * TypedSQLite — comprehensive wrapper around bun:sqlite `Database`.
 *
 * This class provides full type safety for SQLite operations with support for:
 * - All SQLite data types and variations
 * - Built-in SQL functions
 * - Complex constraints and relationships
 * - Generated columns
 * - Table-level constraints
 * - JSON column support
 * - And much more...
 */
/**
 * Auto-backup configuration options
 */
export interface AutoBackupOptions {
  /** Enable automatic backups */
  enabled: boolean
  /** Directory to store backup files */
  directory: string
  /** Backup interval in milliseconds (default: 1 hour) */
  intervalMs?: number
  /** Maximum number of backups to retain (default: 10) */
  maxBackups?: number
  /** Prefix for backup filenames (default: 'backup') */
  filenamePrefix?: string
  /** Whether to compress backups using gzip (default: false) */
  compress?: boolean
}

/**
 * Database configuration options
 */
export interface DBOptions {
  /** PRAGMA settings to apply on database open */
  pragmas?: Array<[string, SQLQueryBindings]>
  /** Paths to SQLite extensions to load */
  loadExtensions?: string[]
  /** Auto-backup configuration */
  autoBackup?: AutoBackupOptions
}

class DB {
  protected db: Database
  protected dbPath: string
  private autoBackupTimer: ReturnType<typeof setInterval> | null = null
  private autoBackupOptions: AutoBackupOptions | null = null
<<<<<<< HEAD
  private baseLogger: Logger
  private dbLog: SqliteLogger
  private backupLog: SqliteLogger
  private tableLog: SqliteLogger
=======
>>>>>>> main

  /**
   * Open or create a SQLite database at `path`.
   *
   * @param path - Path to the SQLite file (e.g. "app.db"). Use ":memory:" for in-memory DB.
   * @param options - Optional database configuration
   */
<<<<<<< HEAD
  constructor(path: string, baseLogger: Logger, options?: DBOptions) {
    this.baseLogger = baseLogger

    // Wire base logger so sqlite-wrapper logs inherit the same LogHook/parents as the consumer.
    this.dbLog = createLogger("DB", this.baseLogger)
    this.backupLog = createLogger("Backup", this.baseLogger)
    this.tableLog = createLogger("Table", this.baseLogger)

    this.dbLog.connection(path, "open")
=======
  constructor(path: string, options?: DBOptions) {
    dbLog.connection(path, "open")
>>>>>>> main
    this.dbPath = path
    this.db = new Database(path)

    // Apply PRAGMA settings if provided
    if (options?.pragmas) {
      for (const [name, value] of options.pragmas) {
        this.pragma(name, value)
      }
    }

    // Load extensions if provided
    if (options?.loadExtensions) {
      for (const extensionPath of options.loadExtensions) {
        this.loadExtension(extensionPath)
      }
    }

    // Setup auto-backup if configured
    if (options?.autoBackup?.enabled) {
      this.setupAutoBackup(options.autoBackup)
    }
  }

  /**
   * Setup automatic backup with retention policy
   */
  private setupAutoBackup(options: AutoBackupOptions): void {
    if (this.dbPath === ":memory:") {
<<<<<<< HEAD
      this.backupLog.warn("Auto-backup is not available for in-memory databases")
=======
      backupLog.warn("Auto-backup is not available for in-memory databases")
>>>>>>> main
      return
    }

    this.autoBackupOptions = {
      enabled: options.enabled,
      directory: options.directory,
      intervalMs: options.intervalMs ?? 60 * 60 * 1000, // Default: 1 hour
      maxBackups: options.maxBackups ?? 10,
      filenamePrefix: options.filenamePrefix ?? "backup",
      compress: options.compress ?? false,
    }

    // Ensure backup directory exists
    const fs = require("node:fs")
    if (!fs.existsSync(this.autoBackupOptions.directory)) {
      fs.mkdirSync(this.autoBackupOptions.directory, { recursive: true })
<<<<<<< HEAD
      this.backupLog.info(`Created backup directory: ${this.autoBackupOptions.directory}`)
=======
      backupLog.info(`Created backup directory: ${this.autoBackupOptions.directory}`)
>>>>>>> main
    }

    // Create initial backup
    this.backup()

    // Setup interval for periodic backups
    this.autoBackupTimer = setInterval(() => {
      this.backup()
    }, this.autoBackupOptions.intervalMs)

<<<<<<< HEAD
    this.backupLog.info(
=======
    backupLog.info(
>>>>>>> main
      `Auto-backup enabled: interval=${this.autoBackupOptions.intervalMs}ms, maxBackups=${this.autoBackupOptions.maxBackups}`
    )
  }

  /**
   * Create a backup of the database
   *
   * @param customPath - Optional custom path for the backup file. If not provided, uses auto-backup settings or generates a timestamped filename.
   * @returns The path to the created backup file
   */
  backup(customPath?: string): string {
    if (this.dbPath === ":memory:") {
      throw new Error("Cannot backup an in-memory database")
    }

    const path = require("node:path")

    let backupPath: string

    if (customPath) {
      backupPath = customPath
    } else if (this.autoBackupOptions) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filename = `${this.autoBackupOptions.filenamePrefix}_${timestamp}.db`
      backupPath = path.join(this.autoBackupOptions.directory, filename)
    } else {
      // Generate a default backup path next to the database file
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const dir = path.dirname(this.dbPath)
      const basename = path.basename(this.dbPath, path.extname(this.dbPath))
      backupPath = path.join(dir, `${basename}_backup_${timestamp}.db`)
    }

    // Use SQLite's backup API via VACUUM INTO for a consistent backup
    try {
      this.db.run(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`)
<<<<<<< HEAD
      this.backupLog.backup("create", backupPath)
=======
      backupLog.backup("create", backupPath)
>>>>>>> main

      // Apply retention policy if auto-backup is enabled
      if (this.autoBackupOptions) {
        this.applyRetentionPolicy()
      }

      return backupPath
    } catch (error) {
<<<<<<< HEAD
      this.backupLog.error(`Failed to create backup: ${error}`)
=======
      backupLog.error(`Failed to create backup: ${error}`)
>>>>>>> main
      throw error
    }
  }

  /**
   * Apply retention policy to remove old backups
   */
  private applyRetentionPolicy(): void {
    if (!this.autoBackupOptions) return

    const fs = require("node:fs")
    const path = require("node:path")

    const backupDir = this.autoBackupOptions.directory
    const prefix = this.autoBackupOptions.filenamePrefix || "backup"
    const maxBackups = this.autoBackupOptions.maxBackups || 10

    try {
      // Get all backup files matching the pattern
      const files = fs
        .readdirSync(backupDir)
        .filter((file: string) => file.startsWith(prefix) && file.endsWith(".db"))
        .map((file: string) => ({
          name: file,
          path: path.join(backupDir, file),
          mtime: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
        }))
        .sort((a: { mtime: number }, b: { mtime: number }) => b.mtime - a.mtime) // Sort by newest first

      // Remove excess backups
      if (files.length > maxBackups) {
        const toDelete = files.slice(maxBackups)
        for (const file of toDelete) {
          fs.unlinkSync(file.path)
<<<<<<< HEAD
          this.backupLog.debug(`Removed old backup: ${file.name}`)
        }
        this.backupLog.info(`Retention policy applied: removed ${toDelete.length} old backup(s)`)
      }
    } catch (error) {
      this.backupLog.error(`Failed to apply retention policy: ${error}`)
=======
          backupLog.debug(`Removed old backup: ${file.name}`)
        }
        backupLog.info(`Retention policy applied: removed ${toDelete.length} old backup(s)`)
      }
    } catch (error) {
      backupLog.error(`Failed to apply retention policy: ${error}`)
>>>>>>> main
    }
  }

  /**
   * List all available backups
   *
   * @returns Array of backup file information
   */
  listBackups(): Array<{ filename: string; path: string; size: number; created: Date }> {
    if (!this.autoBackupOptions) {
<<<<<<< HEAD
      this.backupLog.warn("Auto-backup is not configured. Use backup() with a custom path instead.")
=======
      backupLog.warn("Auto-backup is not configured. Use backup() with a custom path instead.")
>>>>>>> main
      return []
    }

    const fs = require("node:fs")
    const path = require("node:path")

    const backupDir = this.autoBackupOptions.directory
    const prefix = this.autoBackupOptions.filenamePrefix || "backup"

    try {
      return fs
        .readdirSync(backupDir)
        .filter((file: string) => file.startsWith(prefix) && file.endsWith(".db"))
        .map((file: string) => {
          const filePath = path.join(backupDir, file)
          const stats = fs.statSync(filePath)
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.mtime,
          }
        })
        .sort(
          (a: { created: Date }, b: { created: Date }) => b.created.getTime() - a.created.getTime()
        )
    } catch (error) {
<<<<<<< HEAD
      this.backupLog.error(`Failed to list backups: ${error}`)
=======
      backupLog.error(`Failed to list backups: ${error}`)
>>>>>>> main
      return []
    }
  }

  /**
   * Restore database from a backup file
   *
   * @param backupPath - Path to the backup file to restore from
   * @param targetPath - Optional target path. If not provided, restores to the original database path.
   */
  restore(backupPath: string, targetPath?: string): void {
    const fs = require("node:fs")

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`)
    }

    const restorePath = targetPath || this.dbPath

    if (restorePath === ":memory:") {
      throw new Error("Cannot restore to an in-memory database path")
    }

    // Close current connection if restoring to the same path
    if (restorePath === this.dbPath) {
      this.db.close()
    }

    try {
      fs.copyFileSync(backupPath, restorePath)
<<<<<<< HEAD
      this.backupLog.backup("restore", backupPath)
=======
      backupLog.backup("restore", backupPath)
>>>>>>> main

      // Reopen database if we closed it
      if (restorePath === this.dbPath) {
        this.db = new Database(this.dbPath)
<<<<<<< HEAD
        this.dbLog.info("Database connection reopened after restore")
      }
    } catch (error) {
      this.backupLog.error(`Failed to restore backup: ${error}`)
=======
        dbLog.info("Database connection reopened after restore")
      }
    } catch (error) {
      backupLog.error(`Failed to restore backup: ${error}`)
>>>>>>> main
      throw error
    }
  }

  /**
   * Stop auto-backup if it's running
   */
  stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer)
      this.autoBackupTimer = null
<<<<<<< HEAD
      this.backupLog.info("Auto-backup stopped")
=======
      backupLog.info("Auto-backup stopped")
>>>>>>> main
    }
  }

  /**
   * Get the database file path
   */
  getPath(): string {
    return this.dbPath
  }

  /**
   * Get a typed QueryBuilder for a given table name.
   * (Documentation remains the same as before...)
   */
  table<T extends Record<string, unknown>>(
    tableName: string,
    parser: Partial<Parser<T>> = {}
  ): QueryBuilder<T> {
    const pObj: Parser<T> = {
      JSON: parser.JSON || [],
      MODULE: parser.MODULE || {},
      BOOLEAN: parser.BOOLEAN || [],
    }

<<<<<<< HEAD
    this.tableLog.debug(`Creating QueryBuilder for: ${tableName}`)
    return new QueryBuilder<T>(this.db, tableName, pObj, this.baseLogger)
=======
    tableLog.debug(`Creating QueryBuilder for: ${tableName}`)
    return new QueryBuilder<T>(this.db, tableName, pObj)
>>>>>>> main
  }

  /**
   * Close the underlying SQLite database handle.
   * Also stops auto-backup if it's running.
   */
  close(): void {
<<<<<<< HEAD
    this.dbLog.connection(this.dbPath, "close")
=======
    dbLog.connection(this.dbPath, "close")
>>>>>>> main
    this.stopAutoBackup()
    this.db.close()
  }

  /**
   * Create a table with comprehensive type safety and feature support.
   *
   * Now supports all SQLite features:
   *
   * **Basic Usage:**
   * ```ts
   * import { column, sql } from "./db";
   *
   * db.createTable("users", {
   *   id: column.id(), // Auto-incrementing primary key
   *   email: column.varchar(255, { unique: true, notNull: true }),
   *   name: column.text({ notNull: true }),
   *   age: column.integer({ check: 'age >= 0 AND age <= 150' }),
   *   balance: column.numeric({ precision: 10, scale: 2, default: 0 }),
   *   is_active: column.boolean({ default: sql.true() }),
   *   metadata: column.json({ validateJson: true }),
   *   created_at: column.createdAt(),
   *   updated_at: column.updatedAt(),
   * });
   * ```
   *
   * **Advanced Features:**
   * ```ts
   * db.createTable("orders", {
   *   id: column.id(),
   *   order_number: column.varchar(50, {
   *     unique: true,
   *     default: sql.raw("'ORD-' || strftime('%Y%m%d', 'now') || '-' || substr(hex(randomblob(4)), 1, 8)")
   *   }),
   *   customer_id: column.foreignKey('users', 'id', {
   *     onDelete: 'CASCADE',
   *     onUpdate: 'RESTRICT'
   *   }),
   *   status: column.enum(['pending', 'paid', 'shipped', 'delivered'], {
   *     default: 'pending'
   *   }),
   *   total: column.numeric({ precision: 10, scale: 2, notNull: true }),
   *   // Generated column
   *   display_total: {
   *     type: 'TEXT',
   *     generated: {
   *       expression: "printf('$%.2f', total)",
   *       stored: false // VIRTUAL column
   *     }
   *   },
   * }, {
   *   constraints: {
   *     check: ['total >= 0'],
   *     unique: [['customer_id', 'order_number']]
   *   }
   * });
   * ```
   *
   * **Date/Time Columns:**
   * ```ts
   * db.createTable("events", {
   *   id: column.id(),
   *   name: column.text({ notNull: true }),
   *   event_date: column.date({ notNull: true }),
   *   start_time: column.time(),
   *   created_at: column.timestamp({ default: sql.unixTimestamp() }),
   *   expires_at: column.datetime({
   *     default: sql.raw("datetime('now', '+1 year')")
   *   }),
   * });
   * ```
   *
   * **JSON and Advanced Types:**
   * ```ts
   * db.createTable("products", {
   *   id: column.uuid({ generateDefault: true }), // UUID primary key
   *   name: column.text({ notNull: true }),
   *   price: column.real({ check: 'price > 0' }),
   *   specifications: column.json({ validateJson: true }),
   *   tags: column.text(), // JSON array
   *   image_data: column.blob(),
   *   search_vector: {
   *     type: 'TEXT',
   *     generated: {
   *       expression: "lower(name || ' ' || coalesce(json_extract(specifications, '$.description'), ''))",
   *       stored: true // STORED for indexing
   *     }
   *   }
   * });
   * ```
   *
   * @param tableName - Table name to create.
   * @param columns - Column definitions (string, legacy object, or type-safe schema).
   * @param options - Table options including constraints and metadata.
   *
   * @throws {Error} If column definitions are invalid or constraints conflict.
   */
  createTable<_T extends Record<string, unknown> = Record<string, unknown>>(
    tableName: string,
    columns: Record<keyof _T, ColumnDefinition>,
    options?: TableOptions<_T>
  ): QueryBuilder<_T> {
    const temp = options?.temporary ? "TEMPORARY " : tableName === ":memory" ? "TEMPORARY " : ""
    const ifNot = options?.ifNotExists ? "IF NOT EXISTS " : ""
    const withoutRowId = options?.withoutRowId ? " WITHOUT ROWID" : ""

    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    let columnDefs: string
    let tableConstraints: string[] = []

    if (this.isTableSchema(columns)) {
      //  comprehensive type-safe approach
      const parts: string[] = []
      for (const [colName, colDef] of Object.entries(columns)) {
        if (!colName) continue

        const sqlDef = this.buildColumnSQL(colName, colDef)
        parts.push(`${quoteIdent(colName)} ${sqlDef}`)
      }

      if (parts.length === 0) {
        throw new Error("No columns provided")
      }

      columnDefs = parts.join(", ")

      // Add table-level constraints
      if (options?.constraints) {
        tableConstraints = this.buildTableConstraints(options.constraints)
      }
    } else {
      // Original object-based approach
      const parts: string[] = []
      for (const [col, def] of Object.entries(columns as Record<string, string>)) {
        if (!col) continue

        const defTrim = (def || "").trim()
        if (!defTrim) {
          throw new Error(`Missing SQL type/constraints for column "${col}"`)
        }
        parts.push(`${quoteIdent(col)} ${defTrim}`)
      }

      if (parts.length === 0) {
        throw new Error("No columns provided")
      }
      columnDefs = parts.join(", ")
    }

    const allDefinitions = [columnDefs, ...tableConstraints].join(", ")

    const columnNames = Object.keys(columns)
<<<<<<< HEAD
    this.tableLog.tableCreate(tableName, columnNames)
=======
    tableLog.tableCreate(tableName, columnNames)
>>>>>>> main

    const sql = `CREATE ${temp}TABLE ${ifNot}${quoteIdent(
      tableName
    )} (${allDefinitions})${withoutRowId};`

    this.db.run(sql)

    // Store table comment as metadata if provided
    if (options?.comment) {
      this.setTableComment(tableName, options.comment)
    }

    // Auto-detect JSON and BOOLEAN columns from schema
    const autoDetectedJson: Array<keyof _T> = []
    const autoDetectedBoolean: Array<keyof _T> = []

    if (this.isTableSchema(columns)) {
      for (const [colName, colDef] of Object.entries(columns)) {
        if (colDef.type === "JSON") {
          autoDetectedJson.push(colName as keyof _T)
        }
        if (colDef.type === "BOOLEAN") {
          autoDetectedBoolean.push(colName as keyof _T)
        }
      }
    }

    // Merge auto-detected columns with user-provided parser options
    const userJson = options?.parser?.JSON || []
    const userBoolean = options?.parser?.BOOLEAN || []
    const userModule = options?.parser?.MODULE || {}

    // Combine and deduplicate
    const mergedJson = [...new Set([...autoDetectedJson, ...userJson])] as Array<keyof _T>
    const mergedBoolean = [...new Set([...autoDetectedBoolean, ...userBoolean])] as Array<keyof _T>

    const pObj = {
      JSON: mergedJson,
      MODULE: userModule,
      BOOLEAN: mergedBoolean,
    }

<<<<<<< HEAD
    this.tableLog.parserConfig(
      pObj.JSON.map(String),
      pObj.BOOLEAN.map(String),
      Object.keys(pObj.MODULE)
    )
=======
    tableLog.parserConfig(pObj.JSON.map(String), pObj.BOOLEAN.map(String), Object.keys(pObj.MODULE))
>>>>>>> main

    return this.table<_T>(tableName, pObj)
  }

  /**
   * Create an index on a table
   */
  createIndex(
    indexName: string,
    tableName: string,
    columns: string | string[],
    options?: {
      unique?: boolean
      ifNotExists?: boolean
      where?: string
      partial?: string
    }
  ): void {
    const unique = options?.unique ? "UNIQUE " : ""
    const ifNot = options?.ifNotExists ? "IF NOT EXISTS " : ""
    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    const columnList = Array.isArray(columns)
      ? columns.map(quoteIdent).join(", ")
      : quoteIdent(columns)

    let sql = `CREATE ${unique}INDEX ${ifNot}${quoteIdent(
      indexName
    )} ON ${quoteIdent(tableName)} (${columnList})`

    if (options?.where) {
      sql += ` WHERE ${options.where}`
    }

    this.db.run(`${sql};`)
  }

  /**
   * Drop a table
   */
  dropTable(tableName: string, options?: { ifExists?: boolean }): void {
    const ifExists = options?.ifExists ? "IF EXISTS " : ""
    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    const sql = `DROP TABLE ${ifExists}${quoteIdent(tableName)};`
    this.db.run(sql)
  }

  /**
   * Drop an index
   */
  dropIndex(indexName: string, options?: { ifExists?: boolean }): void {
    const ifExists = options?.ifExists ? "IF EXISTS " : ""
    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    const sql = `DROP INDEX ${ifExists}${quoteIdent(indexName)};`
    this.db.run(sql)
  }

  /**
   * Type guard to check if columns definition is a TableSchema
   */
  private isTableSchema(columns: unknown): columns is TableSchema {
    if (typeof columns !== "object" || columns === null) {
      return false
    }

    // Check if any value has a 'type' property with a valid SQLite type
    for (const [_key, value] of Object.entries(columns)) {
      if (typeof value === "object" && value !== null && "type" in value) {
        const type = (value as { type: string }).type
        const validTypes = [
          "INTEGER",
          "TEXT",
          "REAL",
          "BLOB",
          "NUMERIC",
          "INT",
          "TINYINT",
          "SMALLINT",
          "MEDIUMINT",
          "BIGINT",
          "VARCHAR",
          "CHAR",
          "CHARACTER",
          "NCHAR",
          "NVARCHAR",
          "CLOB",
          "DOUBLE",
          "FLOAT",
          "DECIMAL",
          "DATE",
          "DATETIME",
          "TIMESTAMP",
          "TIME",
          "BOOLEAN",
          "JSON",
        ]
        if (validTypes.includes(type)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Build SQL column definition from ColumnDefinition object
   */
  private buildColumnSQL(columnName: string, colDef: ColumnDefinition): string {
    const parts: string[] = []

    // Add type with optional parameters
    let typeStr = colDef.type
    if (colDef.length) {
      typeStr += `(${colDef.length})`
    } else if (colDef.precision !== undefined) {
      if (colDef.scale !== undefined) {
        typeStr += `(${colDef.precision}, ${colDef.scale})`
      } else {
        typeStr += `(${colDef.precision})`
      }
    }
    parts.push(typeStr)

    // Add PRIMARY KEY (must come before AUTOINCREMENT)
    if (colDef.primaryKey) {
      parts.push("PRIMARY KEY")
    }

    // Add AUTOINCREMENT (only valid with INTEGER PRIMARY KEY)
    if (colDef.autoincrement) {
      if (!colDef.type.includes("INT") || !colDef.primaryKey) {
        throw new Error(
          `AUTOINCREMENT can only be used with INTEGER PRIMARY KEY columns (column: ${columnName})`
        )
      }
      parts.push("AUTOINCREMENT")
    }

    // Add NOT NULL (but skip if PRIMARY KEY is already specified, as it's implicit)
    if (colDef.notNull && !colDef.primaryKey) {
      parts.push("NOT NULL")
    }

    // Add UNIQUE
    if (colDef.unique) {
      parts.push("UNIQUE")
    }

    // Add DEFAULT
    if (colDef.default !== undefined) {
      if (colDef.default === null) {
        parts.push("DEFAULT NULL")
      } else if (typeof colDef.default === "object" && colDef.default._type === "expression") {
        // Handle DefaultExpression
        parts.push(`DEFAULT (${colDef.default.expression})`)
      } else if (typeof colDef.default === "string") {
        // Handle string defaults - check if it's a function call or literal
        if (this.isSQLFunction(colDef.default)) {
          parts.push(`DEFAULT (${colDef.default})`)
        } else {
          // Literal string value
          parts.push(`DEFAULT '${colDef.default.replace(/'/g, "''")}'`)
        }
      } else if (typeof colDef.default === "boolean") {
        parts.push(`DEFAULT ${colDef.default ? 1 : 0}`)
      } else {
        parts.push(`DEFAULT ${colDef.default}`)
      }
    }

    // Add COLLATE
    if (colDef.collate) {
      parts.push(`COLLATE ${colDef.collate}`)
    }

    // Add CHECK constraint (replace placeholder with actual column name)
    if (colDef.check) {
      const checkConstraint = colDef.check.replace(
        /\{\{COLUMN\}\}/g,
        `"${columnName.replace(/"/g, '""')}"`
      )
      parts.push(`CHECK (${checkConstraint})`)
    }

    // Add REFERENCES (foreign key)
    if (colDef.references) {
      const ref = colDef.references
      let refClause = `REFERENCES "${ref.table.replace(
        /"/g,
        '""'
      )}"("${ref.column.replace(/"/g, '""')}")`

      if (ref.onDelete) {
        refClause += ` ON DELETE ${ref.onDelete}`
      }

      if (ref.onUpdate) {
        refClause += ` ON UPDATE ${ref.onUpdate}`
      }

      parts.push(refClause)
    }

    // Add GENERATED column
    if (colDef.generated) {
      const storageType = colDef.generated.stored ? "STORED" : "VIRTUAL"
      parts.push(`GENERATED ALWAYS AS (${colDef.generated.expression}) ${storageType}`)
    }
    return parts.join(" ")
  }

  /**
   * Build table-level constraints
   */
  private buildTableConstraints<T>(constraints: TableConstraints<T>): string[] {
    const parts: string[] = []

    // PRIMARY KEY constraint
    if (constraints.primaryKey && constraints.primaryKey.length > 0) {
      const columns = constraints.primaryKey
        .map((col) => `"${String(col).replace(/"/g, '""')}"`)
        .join(", ")
      parts.push(`PRIMARY KEY (${columns})`)
    }

    // UNIQUE constraints
    if (constraints.unique) {
      if (Array.isArray(constraints.unique[0])) {
        // Multiple composite unique constraints
        for (const uniqueGroup of constraints.unique as string[][]) {
          const columns = uniqueGroup.map((col) => `"${col.replace(/"/g, '""')}"`).join(", ")
          parts.push(`UNIQUE (${columns})`)
        }
      } else {
        // Single unique constraint
        const columns = (constraints.unique as string[])
          .map((col) => `"${col.replace(/"/g, '""')}"`)
          .join(", ")
        parts.push(`UNIQUE (${columns})`)
      }
    }

    // CHECK constraints
    if (constraints.check) {
      for (const checkExpr of constraints.check) {
        parts.push(`CHECK (${checkExpr})`)
      }
    }

    // FOREIGN KEY constraints
    if (constraints.foreignKeys) {
      for (const fk of constraints.foreignKeys) {
        const columns = fk.columns.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(", ")
        const refColumns = fk.references.columns
          .map((col) => `"${col.replace(/"/g, '""')}"`)
          .join(", ")

        let fkClause = `FOREIGN KEY (${columns}) REFERENCES "${fk.references.table.replace(
          /"/g,
          '""'
        )}" (${refColumns})`

        if (fk.references.onDelete) {
          fkClause += ` ON DELETE ${fk.references.onDelete}`
        }

        if (fk.references.onUpdate) {
          fkClause += ` ON UPDATE ${fk.references.onUpdate}`
        }

        parts.push(fkClause)
      }
    }

    return parts
  }

  /**
   * Check if a string looks like a SQL function call
   */
  private isSQLFunction(str: string): boolean {
    // Simple heuristic: contains parentheses and common SQL function patterns
    const functionPatterns = [
      /^\w+\s*\(/, // Function name followed by (
      /^(datetime|date|time|strftime|current_timestamp|current_date|current_time)/i,
      /^(random|abs|length|upper|lower|trim)/i,
      /^(coalesce|ifnull|nullif|iif)/i,
      /^(json|json_extract|json_valid)/i,
    ]

    return functionPatterns.some((pattern) => pattern.test(str.trim()))
  }

  /**
   * Store table comment as metadata (using a system table if needed)
   */
  private setTableComment(tableName: string, comment: string): void {
    // Create metadata table if it doesn't exist
    try {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS __table_metadata__ (
          table_name TEXT PRIMARY KEY,
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insert or replace comment
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO __table_metadata__ (table_name, comment, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `)
      stmt.run(tableName, comment)
    } catch (error) {
      // Silently ignore if we can't create metadata table
      this.tableLog.warn(`Could not store table comment for ${tableName}: ${error}`)
    }
  }

  /**
   * Get table comment from metadata
   */
  getTableComment(tableName: string): string | null {
    try {
      const stmt = this.db.prepare(`
        SELECT comment FROM __table_metadata__ WHERE table_name = ?
      `)
      const result = stmt.get(tableName) as { comment: string } | undefined
      return result?.comment || null
    } catch (_error) {
      return null
    }
  }

  /**
   * runute a raw SQL statement
   */
  run(sql: string): void {
    this.tableLog.debug(`Running SQL: ${sql}`)
    this.db.run(sql)
  }

  /**
   * Prepare a SQL statement for repeated runution
   */
  prepare(sql: string) {
    return this.db.prepare(sql)
  }

  /**
   * runute a transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)()
  }

  /**
   * Begin a transaction manually
   */
  begin(mode?: "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE"): void {
    const modeStr = mode ? ` ${mode}` : ""
    this.db.run(`BEGIN${modeStr}`)
  }

  /**
   * Commit a transaction
   */
  commit(): void {
<<<<<<< HEAD
    this.dbLog.transaction("commit")
=======
    dbLog.transaction("commit")
>>>>>>> main
    this.run("COMMIT")
  }

  /**
   * Rollback a transaction
   */
  rollback(): void {
<<<<<<< HEAD
    this.dbLog.transaction("rollback")
=======
    dbLog.transaction("rollback")
>>>>>>> main
    this.run("ROLLBACK")
  }

  /**
   * Create a savepoint
   */
  savepoint(name: string): void {
    const quotedName = `"${name.replace(/"/g, '""')}"`
    this.db.run(`SAVEPOINT ${quotedName}`)
  }

  /**
   * Release a savepoint
   */
  releaseSavepoint(name: string): void {
    const quotedName = `"${name.replace(/"/g, '""')}"`
    this.db.run(`RELEASE SAVEPOINT ${quotedName}`)
  }

  /**
   * Rollback to a savepoint
   */
  rollbackToSavepoint(name: string): void {
    const quotedName = `"${name.replace(/"/g, '""')}"`
    this.db.run(`ROLLBACK TO SAVEPOINT ${quotedName}`)
  }

  /**
   * Vacuum the database (reclaim space and optimize)
   */
  vacuum() {
    const result = this.db.run("VACUUM")
<<<<<<< HEAD
    this.dbLog.debug("Vacuum completed")
=======
    dbLog.debug("Vacuum completed")
>>>>>>> main
    return result
  }

  /**
   * Analyze the database (update statistics for query optimizer)
   */
  analyze(tableName?: string): void {
    if (tableName) {
      const quotedName = `"${tableName.replace(/"/g, '""')}"`
      this.db.run(`ANALYZE ${quotedName}`)
    } else {
      this.db.run("ANALYZE")
    }
  }

  /**
   * Check database integrity
   */
  integrityCheck(): Array<{ integrity_check: string }> {
    const stmt = this.db.prepare("PRAGMA integrity_check")
    return stmt.all() as Array<{ integrity_check: string }>
  }

  /**
   * Get database schema information
   */
  getSchema(): Array<{ name: string; type: string; sql: string }> {
    const stmt = this.db.prepare(`
      SELECT name, type, sql
      FROM sqlite_master
      WHERE type IN ('table', 'index', 'view', 'trigger')
      ORDER BY type, name
    `)
    return stmt.all() as Array<{ name: string; type: string; sql: string }>
  }

  /**
   * Get table info (columns, types, constraints)
   */
  getTableInfo(tableName: string): Array<{
    cid: number
    name: string
    type: string
    notnull: number
    dflt_value: SQLQueryBindings
    pk: number
  }> {
    const stmt = this.db.prepare(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`)
    return stmt.all() as Array<{
      cid: number
      name: string
      type: string
      notnull: number
      dflt_value: SQLQueryBindings
      pk: number
    }>
  }

  /**
   * Get foreign key information for a table
   */
  getForeignKeys(tableName: string): Array<{
    id: number
    seq: number
    table: string
    from: string
    to: string
    on_update: string
    on_delete: string
    match: string
  }> {
    const stmt = this.db.prepare(`PRAGMA foreign_key_list("${tableName.replace(/"/g, '""')}")`)
    return stmt.all() as Array<{
      id: number
      seq: number
      table: string
      from: string
      to: string
      on_update: string
      on_delete: string
      match: string
    }>
  }

  /**
   * Get index information for a table
   */
  getIndexes(tableName: string): Array<{
    name: string
    unique: number
    origin: string
    partial: number
  }> {
    const stmt = this.db.prepare(`PRAGMA index_list("${tableName.replace(/"/g, '""')}")`)
    return stmt.all() as Array<{
      name: string
      unique: number
      origin: string
      partial: number
    }>
  }

  /**
   * Set or get a PRAGMA value.
   *
   * @param name - PRAGMA name (e.g., "foreign_keys", "journal_mode")
   * @param value - Value to set (omit to get current value)
   * @returns Current value when getting, undefined when setting
   */
  pragma(name: string, value?: SQLQueryBindings): SQLQueryBindings | undefined {
    if (value !== undefined) {
      this.db.run(`PRAGMA ${name} = ${value}`)
      return undefined
    }
    const result = this.db.prepare(`PRAGMA ${name}`).get() as Record<string, SQLQueryBindings>
    return Object.values(result)[0]
  }

  /**
   * Load a SQLite extension.
   *
   * @param path - Absolute path to the compiled SQLite extension
   */
  loadExtension(path: string): void {
    this.db.loadExtension(path)
  }

  /**
   * Get direct access to the underlying SQLite database instance.
   * Use this for advanced operations not covered by the wrapper.
   *
   * @returns The underlying Database instance
   */
  getDb(): Database {
    return this.db
  }
}

export { DB }
export default DB
