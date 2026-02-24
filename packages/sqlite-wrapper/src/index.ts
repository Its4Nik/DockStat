import { Database, SQLiteError, type SQLQueryBindings } from "bun:sqlite"
import { Logger } from "@dockstat/logger"
import { backup as helperBackup } from "./lib/backup/backup"
import { listBackups as helperListBackups } from "./lib/backup/listBackups"
import { restore as helperRestore } from "./lib/backup/restore"
import { setupAutoBackup as helperSetupAutoBackup } from "./lib/backup/setupAutoBackup"
// helpers
import { createIndex as helperCreateIndex } from "./lib/index/createIndex"
import { dropIndex as helperDropIndex } from "./lib/index/dropIndex"
import { buildTableConstraints } from "./lib/table/buildTableConstraint"
import { buildTableSQL } from "./lib/table/buildTableSQL"
import { getTableComment as helperGetTableComment } from "./lib/table/getTableComment"
import { isTableSchema } from "./lib/table/isTableSchema"
import { setTableComment as helperSetTableComment } from "./lib/table/setTableComment"
import { checkAndMigrate, tableExists } from "./migration"
import { QueryBuilder } from "./query-builder/index"
import type {
  ColumnDefinition,
  IndexColumn,
  IndexMethod,
  MigrationOptions,
  Parser,
  TableOptions,
} from "./types"
import { allowMigration } from "./utils/allowMigration"

// Re-export all types and utilities
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
  MigrationOptions,
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
  private baseLogger: Logger
  private dbLog: Logger
  private backupLog: Logger
  private tableLog: Logger
  private migrationLog: Logger

  /**
   * Open or create a SQLite database at `path`.
   *
   * @param path - Path to the SQLite file (e.g. "app.db"). Use ":memory:" for in-memory DB.
   * @param options - Optional database configuration
   */
  constructor(path: string, options?: DBOptions, baseLogger?: Logger) {
    if (!baseLogger) {
      this.baseLogger = new Logger("Sqlite-Wrapper")
    } else {
      this.baseLogger = baseLogger
    }

    // Wire base logger so sqlite-wrapper logs inherit the same LogHook/parents as the consumer.
    this.dbLog = this.baseLogger.spawn("DB")
    this.backupLog = this.baseLogger.spawn("Backup")
    this.tableLog = this.baseLogger.spawn("Table")
    this.migrationLog = this.baseLogger.spawn("Migration")

    this.dbLog.info(`Database open: ${path}`)

    this.dbPath = path
    this.db = new Database(path)

    // Apply PRAGMA settings if provided
    if (options?.pragmas) {
      for (const [name, value] of options.pragmas) {
        this.dbLog.info(`Applying Pragma: ${name} - ${JSON.stringify(value)}`)
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
      const res = helperSetupAutoBackup(this.dbPath, this.db, this.backupLog, options.autoBackup)
      this.autoBackupTimer = res.timer
      this.autoBackupOptions = res.autoBackupOptions
    }
  }

  /**
   * List all available backups
   *
   * @returns Array of backup file information
   */
  listBackups(): Array<{ filename: string; path: string; size: number; created: Date }> {
    return helperListBackups(this.autoBackupOptions, this.backupLog)
  }

  /**
   * Create a backup of the database
   *
   * @param customPath - Optional custom path for the backup file. If not provided, uses auto-backup settings or generates a timestamped filename.
   * @returns The path to the created backup file
   */
  backup(customPath?: string): string {
    return helperBackup(
      this.dbPath,
      this.db,
      this.backupLog,
      this.autoBackupOptions ?? undefined,
      customPath
    )
  }

  /**
   * Stop auto-backup if it's running
   */
  stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer)
      this.autoBackupTimer = null
      this.backupLog.info("Auto-backup stopped")
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

    this.tableLog.debug(`Creating QueryBuilder for: ${tableName}`)
    return new QueryBuilder<T>(this.db, tableName, pObj, this.baseLogger)
  }

  /**
   * Close the underlying SQLite database handle.
   * Also stops auto-backup if it's running.
   */
  close(): void {
    this.dbLog.info(`Closed Database: ${this.dbPath}`)
    this.stopAutoBackup()
    this.db.close()
  }

  restore(backupPath: string, targetPath?: string): void {
    const reopened = helperRestore(this.dbPath, this.db, this.backupLog, backupPath, targetPath)
    if (reopened instanceof Database) {
      this.db = reopened
    }
  }

  private normalizeMigrationOptions<T extends Record<string, unknown>>(
    migrate: TableOptions<T>["migrate"]
  ): MigrationOptions {
    if (migrate?.enabled === false) return { enabled: false }
    if (migrate && typeof migrate === "object") {
      return { enabled: true, ...migrate }
    }
    return { enabled: true }
  }

  private shouldCheckExistingTable<_T>(tableName: string, options?: TableOptions<_T>): boolean {
    if (options?.temporary) return false
    if (tableName === ":memory:") return false
    return true
  }

  /**
   * Create a table with comprehensive type safety and feature support.
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
    this.dbLog.info(`Creating Table '${tableName}' with ${Object.keys(columns).length} columns`)

    const pOpts: TableOptions<_T> = {
      ...options,
      migrate: this.normalizeMigrationOptions(options?.migrate),
    }

    const canMigrate = allowMigration(options || {}, tableName, this.migrationLog)

    const tableAlreadyExists =
      this.shouldCheckExistingTable(tableName, options) && tableExists(this.db, tableName)

    if (tableAlreadyExists) {
      if (canMigrate) {
        let tableConstraints: string[] = []
        if (isTableSchema(columns) && options?.constraints) {
          tableConstraints = buildTableConstraints(options.constraints)
        }

        const currentSchema = this.getSchema().find((o) => {
          return o.name === tableName
        })

        this.migrationLog.debug(`${JSON.stringify(currentSchema)}`)

        if (!currentSchema) {
          this.migrationLog.info("Schema of table not found; new table => no migration needed")
        } else {
          const migrated = checkAndMigrate({
            db: this.db,
            tableName,
            currentSchema,
            migrationLog: this.migrationLog,
            newColumns: columns,
            tableConstraints,
            options: (pOpts || {}) as TableOptions<Record<string, unknown>>,
          })

          /*
          this.db,
          tableName,
          columns,
          this.migrationLog,
          currentSchema,
          tableConstraints
          pOpts,

          */

          if (migrated) {
            return this._setupTableParser<_T>(tableName, columns, options)
          }
        }
      }

      if (!options?.ifNotExists) {
        return this._setupTableParser<_T>(tableName, columns, options)
      }
    }

    try {
      const sql = buildTableSQL(tableName, columns, options)

      this.db.run(sql.sql)

      // Store table comment as metadata if provided
      if (options?.comment) {
        helperSetTableComment(this.db, this.tableLog, tableName, options.comment)
      }

      return this._setupTableParser<_T>(tableName, columns, options)
    } catch (error: unknown) {
      if ((error as SQLiteError).errno === 1) {
        return this._setupTableParser<_T>(tableName, columns, options)
      }

      throw new SQLiteError((error as SQLiteError).message, { cause: (error as SQLiteError).cause })
    }
  }

  /**
   * Setup parser for table (extracted for reuse after migration)
   */
  private _setupTableParser<_T extends Record<string, unknown> = Record<string, unknown>>(
    tableName: string,
    columns: Record<keyof _T, unknown>,
    options?: TableOptions<_T>
  ): QueryBuilder<_T> {
    // Auto-detect JSON and BOOLEAN columns from schema
    const autoDetectedJson: Array<keyof _T> = []
    const autoDetectedBoolean: Array<keyof _T> = []

    if (isTableSchema(columns)) {
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

    this.tableLog.debug(`Parser config: ${JSON.stringify(pObj)}`)

    return this.table<_T>(tableName, pObj)
  }

  /**
   * Create an index on a table
   */
  createIndex(
    indexName: string,
    tableName: string,
    columns: IndexColumn | IndexColumn[],
    options?: {
      unique?: boolean
      ifNotExists?: boolean
      /** Alias for `where` */
      partial?: string
      /** WHERE clause for partial indexes */
      where?: string
      /** Index method (USING ...) */
      using?: IndexMethod
    }
  ): void {
    helperCreateIndex(this.db, indexName, tableName, columns, options)
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
    helperDropIndex(this.db, indexName, options)
  }

  /**
   * Store table comment as metadata (using a system table if needed)
   */
  getTableComment(tableName: string): string | null {
    return helperGetTableComment(this.db, tableName)
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
    this.dbLog.info("Running commit...")
    this.run("COMMIT")
  }

  /**
   * Rollback a transaction
   */
  rollback(): void {
    this.dbLog.info("Running rollback..")
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
    this.dbLog.debug("Vacuum completed")
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
