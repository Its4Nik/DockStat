import { Database, type SQLQueryBindings } from 'bun:sqlite'
import { createLogger } from '@dockstat/logger'
import { QueryBuilder } from './query-builder/index'
import type {
  ColumnConstraints,
  ColumnDefinition,
  DefaultExpression,
  ForeignKeyAction,
  JsonColumnConfig,
  SQLiteType,
  TableConstraints,
  TableOptions,
  TableSchema,
} from './types'

const logger = createLogger('sqlite-wrapper')

/**
 * Re-export all types and utilities
 */
export { QueryBuilder }
export type {
  InsertResult,
  UpdateResult,
  DeleteResult,
  InsertOptions,
  ColumnNames,
  WhereCondition,
  RegexCondition,
  JsonColumnConfig,
  TableSchema,
  ColumnDefinition,
  SQLiteType,
  ColumnConstraints,
  TableOptions,
  DefaultExpression,
  ForeignKeyAction,
  TableConstraints,
} from './types'

// Re-export helper utilities
export {
  column,
  sql,
  SQLiteTypes,
  SQLiteFunctions,
  SQLiteKeywords,
  defaultExpr,
} from './types'

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
class DB {
  private db: Database

  /**
   * Open or create a SQLite database at `path`.
   *
   * @param path - Path to the SQLite file (e.g. "app.db"). Use ":memory:" for in-memory DB.
   * @param options - Optional database configuration
   */
  constructor(
    path: string,
    options?: {
      pragmas?: Array<[string, SQLQueryBindings]>
      loadExtensions?: string[]
    }
  ) {
    logger.info(`Opening database: ${path}`)
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
  }

  /**
   * Get a typed QueryBuilder for a given table name.
   * (Documentation remains the same as before...)
   */
  table<T extends Record<string, unknown>>(
    tableName: string,
    jsonConfig?: JsonColumnConfig<T>
  ): QueryBuilder<T> {
    logger.debug(`Creating QueryBuilder for table: ${tableName}`)
    return new QueryBuilder<T>(this.db, tableName, jsonConfig)
  }

  /**
   * Close the underlying SQLite database handle.
   */
  close(): void {
    logger.info('Closing database connection')
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
  createTable<_T extends Record<string, unknown>>(
    tableName: string,
    columns: string | Record<string, string> | TableSchema,
    options?: TableOptions
  ): QueryBuilder<_T> {
    const temp = options?.temporary ? 'TEMPORARY ' : ''
    const ifNot = options?.ifNotExists ? 'IF NOT EXISTS ' : ''
    const withoutRowId = options?.withoutRowId ? ' WITHOUT ROWID' : ''

    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    let columnDefs: string
    let tableConstraints: string[] = []

    if (typeof columns === 'string') {
      // Original string-based approach
      columnDefs = columns.trim()
      if (!columnDefs) {
        throw new Error('Empty column definition string')
      }
    } else if (this.isTableSchema(columns)) {
      // New comprehensive type-safe approach
      const parts: string[] = []
      for (const [colName, colDef] of Object.entries(columns)) {
        if (!colName) continue

        const sqlDef = this.buildColumnSQL(colName, colDef)
        parts.push(`${quoteIdent(colName)} ${sqlDef}`)
      }

      if (parts.length === 0) {
        throw new Error('No columns provided')
      }
      columnDefs = parts.join(', ')

      // Add table-level constraints
      if (options?.constraints) {
        tableConstraints = this.buildTableConstraints(options.constraints)
      }
    } else {
      // Original object-based approach
      const parts: string[] = []
      for (const [col, def] of Object.entries(columns)) {
        if (!col) continue

        const defTrim = (def ?? '').trim()
        if (!defTrim) {
          throw new Error(`Missing SQL type/constraints for column "${col}"`)
        }
        parts.push(`${quoteIdent(col)} ${defTrim}`)
      }

      if (parts.length === 0) {
        throw new Error('No columns provided')
      }
      columnDefs = parts.join(', ')
    }

    // Combine column definitions and table constraints
    const allDefinitions = [columnDefs, ...tableConstraints].join(', ')

    const sql = `CREATE ${temp}TABLE ${ifNot}${quoteIdent(tableName)} (${allDefinitions})${withoutRowId};`

    this.db.run(sql)

    // Store table comment as metadata if provided
    if (options?.comment) {
      this.setTableComment(tableName, options.comment)
    }

    return this.table<_T>(tableName)
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
    const unique = options?.unique ? 'UNIQUE ' : ''
    const ifNot = options?.ifNotExists ? 'IF NOT EXISTS ' : ''
    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    const columnList = Array.isArray(columns)
      ? columns.map(quoteIdent).join(', ')
      : quoteIdent(columns)

    let sql = `CREATE ${unique}INDEX ${ifNot}${quoteIdent(indexName)} ON ${quoteIdent(tableName)} (${columnList})`

    if (options?.where) {
      sql += ` WHERE ${options.where}`
    }

    this.db.run(`${sql};`)
  }

  /**
   * Drop a table
   */
  dropTable(tableName: string, options?: { ifExists?: boolean }): void {
    const ifExists = options?.ifExists ? 'IF EXISTS ' : ''
    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    const sql = `DROP TABLE ${ifExists}${quoteIdent(tableName)};`
    this.db.run(sql)
  }

  /**
   * Drop an index
   */
  dropIndex(indexName: string, options?: { ifExists?: boolean }): void {
    const ifExists = options?.ifExists ? 'IF EXISTS ' : ''
    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

    const sql = `DROP INDEX ${ifExists}${quoteIdent(indexName)};`
    this.db.run(sql)
  }

  /**
   * Type guard to check if columns definition is a TableSchema
   */
  private isTableSchema(columns: unknown): columns is TableSchema {
    if (typeof columns !== 'object' || columns === null) {
      return false
    }

    // Check if any value has a 'type' property with a valid SQLite type
    for (const [_key, value] of Object.entries(columns)) {
      if (typeof value === 'object' && value !== null && 'type' in value) {
        const type = (value as { type: string }).type
        const validTypes = [
          'INTEGER',
          'TEXT',
          'REAL',
          'BLOB',
          'NUMERIC',
          'INT',
          'TINYINT',
          'SMALLINT',
          'MEDIUMINT',
          'BIGINT',
          'VARCHAR',
          'CHAR',
          'CHARACTER',
          'NCHAR',
          'NVARCHAR',
          'CLOB',
          'DOUBLE',
          'FLOAT',
          'DECIMAL',
          'DATE',
          'DATETIME',
          'TIMESTAMP',
          'TIME',
          'BOOLEAN',
          'JSON',
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
      parts.push('PRIMARY KEY')
    }

    // Add AUTOINCREMENT (only valid with INTEGER PRIMARY KEY)
    if (colDef.autoincrement) {
      if (!colDef.type.includes('INT') || !colDef.primaryKey) {
        throw new Error(
          `AUTOINCREMENT can only be used with INTEGER PRIMARY KEY columns (column: ${columnName})`
        )
      }
      parts.push('AUTOINCREMENT')
    }

    // Add NOT NULL (but skip if PRIMARY KEY is already specified, as it's implicit)
    if (colDef.notNull && !colDef.primaryKey) {
      parts.push('NOT NULL')
    }

    // Add UNIQUE
    if (colDef.unique) {
      parts.push('UNIQUE')
    }

    // Add DEFAULT
    if (colDef.default !== undefined) {
      if (colDef.default === null) {
        parts.push('DEFAULT NULL')
      } else if (
        typeof colDef.default === 'object' &&
        colDef.default._type === 'expression'
      ) {
        // Handle DefaultExpression
        parts.push(`DEFAULT (${colDef.default.expression})`)
      } else if (typeof colDef.default === 'string') {
        // Handle string defaults - check if it's a function call or literal
        if (this.isSQLFunction(colDef.default)) {
          parts.push(`DEFAULT (${colDef.default})`)
        } else {
          // Literal string value
          parts.push(`DEFAULT '${colDef.default.replace(/'/g, "''")}'`)
        }
      } else if (typeof colDef.default === 'boolean') {
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
      let refClause = `REFERENCES "${ref.table.replace(/"/g, '""')}"("${ref.column.replace(/"/g, '""')}")`

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
      const storageType = colDef.generated.stored ? 'STORED' : 'VIRTUAL'
      parts.push(
        `GENERATED ALWAYS AS (${colDef.generated.expression}) ${storageType}`
      )
    }

    return parts.join(' ')
  }

  /**
   * Build table-level constraints
   */
  private buildTableConstraints(constraints: TableConstraints): string[] {
    const parts: string[] = []

    // PRIMARY KEY constraint
    if (constraints.primaryKey && constraints.primaryKey.length > 0) {
      const columns = constraints.primaryKey
        .map((col) => `"${col.replace(/"/g, '""')}"`)
        .join(', ')
      parts.push(`PRIMARY KEY (${columns})`)
    }

    // UNIQUE constraints
    if (constraints.unique) {
      if (Array.isArray(constraints.unique[0])) {
        // Multiple composite unique constraints
        for (const uniqueGroup of constraints.unique as string[][]) {
          const columns = uniqueGroup
            .map((col) => `"${col.replace(/"/g, '""')}"`)
            .join(', ')
          parts.push(`UNIQUE (${columns})`)
        }
      } else {
        // Single unique constraint
        const columns = (constraints.unique as string[])
          .map((col) => `"${col.replace(/"/g, '""')}"`)
          .join(', ')
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
        const columns = fk.columns
          .map((col) => `"${col.replace(/"/g, '""')}"`)
          .join(', ')
        const refColumns = fk.references.columns
          .map((col) => `"${col.replace(/"/g, '""')}"`)
          .join(', ')

        let fkClause = `FOREIGN KEY (${columns}) REFERENCES "${fk.references.table.replace(/"/g, '""')}" (${refColumns})`

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
      console.warn(`Could not store table comment for ${tableName}:`, error)
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
    logger.debug(`runuting SQL: ${sql}`)
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
  begin(mode?: 'DEFERRED' | 'IMMEDIATE' | 'EXCLUSIVE'): void {
    const modeStr = mode ? ` ${mode}` : ''
    this.db.run(`BEGIN${modeStr}`)
  }

  /**
   * Commit a transaction
   */
  commit(): void {
    logger.debug('Committing transaction')
    this.run('COMMIT')
  }

  /**
   * Rollback a transaction
   */
  rollback(): void {
    logger.warn('Rolling back transaction')
    this.run('ROLLBACK')
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
  vacuum(): void {
    this.db.run('VACUUM')
  }

  /**
   * Analyze the database (update statistics for query optimizer)
   */
  analyze(tableName?: string): void {
    if (tableName) {
      const quotedName = `"${tableName.replace(/"/g, '""')}"`
      this.db.run(`ANALYZE ${quotedName}`)
    } else {
      this.db.run('ANALYZE')
    }
  }

  /**
   * Check database integrity
   */
  integrityCheck(): Array<{ integrity_check: string }> {
    const stmt = this.db.prepare('PRAGMA integrity_check')
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
    const stmt = this.db.prepare(
      `PRAGMA table_info("${tableName.replace(/"/g, '""')}")`
    )
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
    const stmt = this.db.prepare(
      `PRAGMA foreign_key_list("${tableName.replace(/"/g, '""')}")`
    )
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
    const stmt = this.db.prepare(
      `PRAGMA index_list("${tableName.replace(/"/g, '""')}")`
    )
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
    const result = this.db.prepare(`PRAGMA ${name}`).get() as Record<
      string,
      SQLQueryBindings
    >
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
