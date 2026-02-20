import type { Database } from "bun:sqlite"
import { buildColumnSQL } from "./lib/table/buildColumnSQL"
import { buildTableSQL } from "./lib/table/buildTableSQL"
import type {
  ColumnDefinition,
  ForeignKeyInfo,
  ForeignKeyStatus,
  IndexInfo,
  TableColumn,
  TableOptions,
} from "./types"
import type Logger from "@dockstat/logger"

/**
 * Get the current schema of a table
 */
export function getTableColumns(db: Database, tableName: string): TableColumn[] {
  const stmt = db.prepare(`PRAGMA table_info("${tableName}")`)
  return stmt.all() as TableColumn[]
}

/**
 * Get indexes for a table
 */
export function getTableIndexes(db: Database, tableName: string): IndexInfo[] {
  interface PragmaIndex {
    seq: number
    name: string
    unique: number
    origin: string
    partial: number
  }

  interface SqliteMasterRow {
    sql: string | null
  }

  const stmt = db.prepare(`PRAGMA index_list("${tableName}")`)
  const indexes = stmt.all() as PragmaIndex[]

  return indexes.map((idx) => {
    const sqlStmt = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?`)
    const sqlResult = sqlStmt.get(idx.name) as SqliteMasterRow | null

    return {
      name: idx.name,
      sql: sqlResult?.sql || null,
      unique: idx.unique === 1,
      origin: idx.origin,
      partial: idx.partial,
    }
  })
}

/**
 * Get foreign keys for a table
 */
export function getTableForeignKeys(db: Database, tableName: string): ForeignKeyInfo[] {
  const stmt = db.prepare(`PRAGMA foreign_key_list("${tableName}")`)
  return stmt.all() as ForeignKeyInfo[]
}

/**
 * Get triggers for a table
 */
export function getTableTriggers(
  db: Database,
  tableName: string
): Array<{ name: string; sql: string }> {
  const stmt = db.prepare(
    `SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ?`
  )
  return stmt.all(tableName) as Array<{ name: string; sql: string }>
}

/**
 * Check if a table exists
 */
export function tableExists(db: Database, tableName: string): boolean {
  const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
  const result = stmt.get(tableName)
  return result !== null
}

/**
 * Compare two schemas to determine if migration is needed
 */
export function schemasAreDifferent<TCols extends Record<string, unknown>>(
  currentSchema: {
    name: string
    type: string
    sql: string
  },
  newColumns: Record<keyof TCols, ColumnDefinition>,
  options: TableOptions<TCols>,
  logger: Logger
): boolean {
  logger.info("Comparing schemas")

  const pCurrentSchemaSQL = currentSchema.sql.trim().endsWith(";")
    ? currentSchema.sql.trim()
    : `${currentSchema.sql.trim()};`

  const newTableSQL = buildTableSQL(currentSchema.name, newColumns, options)

  const pNewSchemaSQL = newTableSQL.sql.trim().endsWith(";")
    ? newTableSQL.sql.trim()
    : `${newTableSQL.sql.trim()};`

  // Handle IF NOT EXISTS discrepancy and column name quoting differences
  // SQLite doesn't store IF NOT EXISTS in sqlite_master, so we need to normalize both schemas
  // by removing IF NOT EXISTS from the new schema before comparison
  // Also normalize column name quoting differences
  const normalizedCurrentSchema = pCurrentSchemaSQL.replace(/"(\w+)"/g, "$1") // Remove quotes around column names

  const normalizedNewSchema = options?.ifNotExists
    ? pNewSchemaSQL
        .replace(/CREATE\s+(?:TEMPORARY\s+)?TABLE\s+IF\s+NOT\s+EXISTS\s+/, "CREATE TABLE ")
        .replace(/"(\w+)"/g, "$1") // Remove quotes around column names
    : pNewSchemaSQL.replace(/"(\w+)"/g, "$1") // Remove quotes around column names

  if (normalizedCurrentSchema !== normalizedNewSchema) {
    logger.info("Schema changes detected")
    logger.debug(`Old Schema: ${normalizedCurrentSchema}`)
    logger.debug(`New Schema: ${normalizedNewSchema}`)
    return true
  }

  logger.info("No schema changes detected")
  return false
}

function extractColumnNamesFromCreateTable(sql: string): string[] {
  // Remove line breaks and collapse spaces
  const normalized = sql.replace(/\n/g, " ").replace(/\s+/g, " ")

  // Extract everything inside the main parentheses
  const match = normalized.match(/\((.*)\)/)
  if (!match) return []

  const body = match[1]

  // Split by commas BUT ignore commas inside parentheses (e.g. DECIMAL(10,2))
  const parts: string[] = []
  let current = ""
  let depth = 0

  for (const char of body) {
    if (char === "(") depth++
    if (char === ")") depth--

    if (char === "," && depth === 0) {
      parts.push(current.trim())
      current = ""
      continue
    }

    current += char
  }
  if (current.trim()) parts.push(current.trim())

  // Filter out table constraints and extract column identifiers
  const columnNames: string[] = []

  for (const part of parts) {
    const trimmed = part.trim().toUpperCase()

    if (
      trimmed.startsWith("PRIMARY KEY") ||
      trimmed.startsWith("FOREIGN KEY") ||
      trimmed.startsWith("UNIQUE") ||
      trimmed.startsWith("CHECK") ||
      trimmed.startsWith("CONSTRAINT")
    ) {
      continue
    }

    // first token = column name
    const firstToken = part.trim().split(/\s+/)[0]

    const name = firstToken.replace(/^["`[]/, "").replace(/["`\]]$/, "")

    columnNames.push(name)
  }

  return columnNames
}

export function generateColumnMapping(
  currentSchema: string,
  newColumns: Record<string, unknown>
): { selectColumns: string[]; insertColumns: string[] } {
  const currentColumnNames = new Set(extractColumnNamesFromCreateTable(currentSchema))
  const newColumnNames = Object.keys(newColumns)

  const commonColumns = newColumnNames.filter((name) => currentColumnNames.has(name))

  return {
    selectColumns: commonColumns,
    insertColumns: commonColumns,
  }
}

/**
 * Migrate a table to a new schema
 */
export function migrateTable<TCols extends Record<string, unknown>>(
  db: Database,
  tableName: string,
  newColumns: Record<keyof TCols, ColumnDefinition>,
  options: TableOptions<TCols> = {},
  tableConstraints: string[] = [],
  migrationLog: Logger,
  currentSchema: {
    name: string
    sql: string
    type: string
  }
): void {
  migrationLog.info(`Starting migration for table: ${tableName}`)

  const migrationOpts = options.migrate !== undefined ? options.migrate : {}
  const {
    preserveData = true,
    onConflict = "fail",
    tempTableSuffix = "_migration_temp",
  } = migrationOpts

  const indexes = getTableIndexes(db, tableName)
  const triggers = getTableTriggers(db, tableName)

  // Check if migration is needed
  if (!schemasAreDifferent(currentSchema, newColumns, options, migrationLog)) {
    migrationLog.info(`No migration needed for table: ${tableName}`)
    return
  }

  const tempTableName = `${tableName}${tempTableSuffix}`

  const fkStatus = db.prepare("PRAGMA foreign_keys").get() as ForeignKeyStatus | null
  if (fkStatus && fkStatus.foreign_keys === 1) {
    db.run("PRAGMA foreign_keys = OFF")
  }

  db.transaction(() => {
    try {
      // Step 1: Create temporary table with new schema
      migrationLog.debug(`Creating temporary table: ${tempTableName}`)
      const columnDefs: string[] = []

      for (const [colName, colDef] of Object.entries(
        newColumns as Record<string, ColumnDefinition>
      )) {
        const sqlDef = buildColumnSQL(colName, colDef)
        columnDefs.push(`"${colName}" ${sqlDef}`)
      }

      // Include table constraints if provided
      const allDefinitions =
        tableConstraints.length > 0
          ? [...columnDefs, ...tableConstraints].join(", ")
          : columnDefs.join(", ")

      const createTempTableSql = `CREATE TABLE "${tempTableName}" (${allDefinitions})`
      db.run(createTempTableSql)

      // Step 2: Copy data if requested
      if (preserveData && currentSchema.sql.length > 0) {
        const { selectColumns, insertColumns } = generateColumnMapping(
          currentSchema.sql,
          newColumns
        )

        if (selectColumns.length > 0) {
          migrationLog.debug(`Copying data from ${tableName} to ${tempTableName}`)

          const quotedSelectCols = selectColumns.map((col) => `"${col}"`).join(", ")
          const quotedInsertCols = insertColumns.map((col) => `"${col}"`).join(", ")

          migrationLog.debug("Building base SQL statement")
          let copySql = `INSERT INTO "${tempTableName}" (${quotedInsertCols})
                         SELECT ${quotedSelectCols} FROM "${tableName}"`

          if (onConflict === "ignore") {
            migrationLog.debug("Building ignore statement")
            copySql = `INSERT OR IGNORE INTO "${tempTableName}" (${quotedInsertCols})
                       SELECT ${quotedSelectCols} FROM "${tableName}"`
          } else if (onConflict === "replace") {
            migrationLog.debug("Building replace statement")
            copySql = `INSERT OR REPLACE INTO "${tempTableName}" (${quotedInsertCols})
                       SELECT ${quotedSelectCols} FROM "${tableName}"`
          }

          migrationLog.debug(`Running migration: ${JSON.stringify(copySql)}`)

          db.run(copySql)
        }
      }

      // Step 3: Drop the original table
      migrationLog.debug(`Dropping original table: ${tableName}`)

      db.run(`DROP TABLE "${tableName}"`)

      // Step 4: Rename temporary table to original name
      migrationLog.debug(`Renaming ${tempTableName} to ${tableName}`)
      db.run(`ALTER TABLE "${tempTableName}" RENAME TO "${tableName}"`)

      // Step 5: Recreate indexes
      for (const index of indexes) {
        if (index.sql && !index.sql.includes("sqlite_autoindex")) {
          migrationLog.debug(`Recreating index: ${index.name}`)
          try {
            db.run(index.sql)
          } catch (err) {
            migrationLog.warn(`Failed to recreate index ${index.name}: ${err}`)
          }
        }
      }

      // Step 6: Recreate triggers
      for (const trigger of triggers) {
        migrationLog.debug(`Recreating trigger: ${trigger.name}`)
        try {
          db.run(trigger.sql)
        } catch (err) {
          migrationLog.warn(`Failed to recreate trigger ${trigger.name}: ${err}`)
        }
      }

      // Re-enable foreign key constraints if they were enabled

      migrationLog.info(`Successfully migrated table: ${tableName}`)
    } catch (error) {
      migrationLog.error(`Migration failed for table ${tableName}: ${error}`)
      throw error
    }
  })()

  if (fkStatus && fkStatus.foreign_keys === 1) {
    db.run("PRAGMA foreign_keys = ON")
  }
}

/**
 * Check if migration is needed and perform if necessary
 */
export function checkAndMigrate<TCols extends Record<string, unknown>>({
  db,
  tableName,
  newColumns,
  migrationLog,
  currentSchema,
  options,
  tableConstraints = [],
}: {
  db: Database
  tableName: string
  newColumns: Record<keyof TCols, ColumnDefinition>
  migrationLog: Logger
  currentSchema: {
    name: string
    type: string
    sql: string
  }
  options: TableOptions<TCols>
  tableConstraints?: string[]
}): boolean {
  const logger = migrationLog.spawn(tableName)

  logger.debug("Checking if Table exists")

  if (!tableExists(db, tableName)) {
    return false
  }
  logger.debug("Getting current schema")

  //const currentSchema = getTableColumns(db, tableName)

  if (schemasAreDifferent(currentSchema, newColumns, options, logger)) {
    migrateTable(db, tableName, newColumns, options, tableConstraints, migrationLog, currentSchema)
    return true
  }

  return false
}
