import type { Database } from "bun:sqlite"
import type { ColumnDefinition, MigrationOptions } from "./types"
import { buildColumnSQL } from "./lib/table/buildColumnSQL"
import { SqliteLogger } from "./utils/logger"

export interface TableColumn {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | number | null
  pk: number
}

export interface IndexInfo {
  name: string
  sql: string | null
  unique: boolean
  origin: string
  partial: number
}

export interface ForeignKeyInfo {
  id: number
  seq: number
  table: string
  from: string
  to: string
  on_update: string
  on_delete: string
  match: string
}

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
    const infoStmt = db.prepare(`PRAGMA index_info("${idx.name}")`)
    infoStmt.all() // Execute but don't need the result for this use case

    // Get the CREATE INDEX statement if available
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
export function schemasAreDifferent(
  currentSchema: TableColumn[],
  newColumns: Record<string, ColumnDefinition>,
  logger: SqliteLogger
): boolean {
  logger.info("Comparing schemas")
  const currentColumnNames = new Set(currentSchema.map((col) => col.name))
  const newColumnNames = new Set(Object.keys(newColumns))

  // Check if column count differs
  if (currentColumnNames.size !== newColumnNames.size) {
    logger.info("Column count differs")
    return true
  }

  // Check if all column names match
  for (const name of newColumnNames) {
    if (!currentColumnNames.has(name)) {
      logger.info(`Column ${name} does not exist`)
      return true
    }
    logger.debug(`Column ${name} exists`)
  }

  // Check column definitions
  for (const currentCol of currentSchema) {
    const newCol = newColumns[currentCol.name]
    if (!newCol) {
      logger.info(`Column ${currentCol.name} does not exist`)
      return true
    }

    // For primary key columns, SQLite auto-adds AUTOINCREMENT which we need to account for
    const isCurrentPK = currentCol.pk === 1
    const isNewPK = newCol.primaryKey === true || newCol.autoincrement === true

    // If both are primary keys, consider them the same (don't check other constraints)
    if (isCurrentPK && isNewPK) {
      logger.info(`Column ${currentCol.name} is a primary key`)
      continue
    }

    if (isCurrentPK !== isNewPK) {
      logger.info(
        `Column ${currentCol.name} primary key status differs (current: ${isCurrentPK}, new: ${isNewPK})`
      )
      return true
    }

    // Check if NOT NULL constraint differs (ignore for primary keys as they're always NOT NULL)
    if (!isCurrentPK) {
      const isCurrentNotNull = currentCol.notnull === 1
      const isNewNotNull = newCol.notNull === true
      if (isCurrentNotNull !== isNewNotNull) {
        logger.info(
          `Column ${currentCol.name} NOT NULL constraint differs (current: ${isCurrentNotNull}, new: ${isNewNotNull})`
        )
        return true
      }
    }

    // Basic type comparison (normalize types)
    const normalizeType = (type: string) => type.toUpperCase().split("(")[0].trim()
    const currentType = normalizeType(currentCol.type)
    const newType = normalizeType(newCol.type)

    // Handle type aliases
    const typeAliases: Record<string, string> = {
      INT: "INTEGER",
      BOOL: "INTEGER",
      BOOLEAN: "INTEGER",
      JSON: "TEXT",
      VARCHAR: "TEXT",
      CHAR: "TEXT",
      DATETIME: "TEXT",
      DATE: "TEXT",
      TIMESTAMP: "TEXT",
    }

    const normalizedCurrentType = typeAliases[currentType] || currentType
    const normalizedNewType = typeAliases[newType] || newType

    if (normalizedCurrentType !== normalizedNewType) {
      logger.info(`Column ${currentCol.name} type differs`)
      return true
    }
  }

  logger.info("No schema changes detected")
  return false
}

/**
 * Generate column mapping for data migration
 */
export function generateColumnMapping(
  currentSchema: TableColumn[],
  newColumns: Record<string, ColumnDefinition>
): { selectColumns: string[]; insertColumns: string[] } {
  const currentColumnNames = new Set(currentSchema.map((col) => col.name))
  const newColumnNames = Object.keys(newColumns)

  // Find common columns
  const commonColumns = newColumnNames.filter((name) => currentColumnNames.has(name))

  return {
    selectColumns: commonColumns,
    insertColumns: commonColumns,
  }
}

/**
 * Migrate a table to a new schema
 */
export function migrateTable(
  db: Database,
  tableName: string,
  newColumns: Record<string, ColumnDefinition>,
  options: MigrationOptions = {},
  tableConstraints: string[] = [],
  migrationLog: SqliteLogger
): void {
  const { preserveData = true, onConflict = "fail", tempTableSuffix = "_migration_temp" } = options

  migrationLog.info(`Starting migration for table: ${tableName}`)

  // Get current table info
  const currentSchema = getTableColumns(db, tableName)
  const indexes = getTableIndexes(db, tableName)
  const triggers = getTableTriggers(db, tableName)

  // Check if migration is needed
  if (!schemasAreDifferent(currentSchema, newColumns, migrationLog)) {
    migrationLog.info(`No migration needed for table: ${tableName}`)
    return
  }

  const tempTableName = `${tableName}${tempTableSuffix}`

  // Start transaction for atomic migration
  db.transaction(() => {
    try {
      // Step 1: Create temporary table with new schema
      migrationLog.debug(`Creating temporary table: ${tempTableName}`)
      const columnDefs: string[] = []

      for (const [colName, colDef] of Object.entries(newColumns)) {
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
      if (preserveData && currentSchema.length > 0) {
        const { selectColumns, insertColumns } = generateColumnMapping(currentSchema, newColumns)

        if (selectColumns.length > 0) {
          migrationLog.debug(`Copying data from ${tableName} to ${tempTableName}`)

          const quotedSelectCols = selectColumns.map((col) => `"${col}"`).join(", ")
          const quotedInsertCols = insertColumns.map((col) => `"${col}"`).join(", ")

          let copySql = `INSERT INTO "${tempTableName}" (${quotedInsertCols})
                         SELECT ${quotedSelectCols} FROM "${tableName}"`

          if (onConflict === "ignore") {
            copySql = `INSERT OR IGNORE INTO "${tempTableName}" (${quotedInsertCols})
                       SELECT ${quotedSelectCols} FROM "${tableName}"`
          } else if (onConflict === "replace") {
            copySql = `INSERT OR REPLACE INTO "${tempTableName}" (${quotedInsertCols})
                       SELECT ${quotedSelectCols} FROM "${tableName}"`
          }

          db.run(copySql)
        }
      }

      // Step 3: Drop the original table
      migrationLog.debug(`Dropping original table: ${tableName}`)

      // Temporarily disable foreign key constraints
      interface ForeignKeyStatus {
        foreign_keys: number
      }
      const fkStatus = db.prepare("PRAGMA foreign_keys").get() as ForeignKeyStatus | null
      if (fkStatus && fkStatus.foreign_keys === 1) {
        db.run("PRAGMA foreign_keys = OFF")
      }

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
      if (fkStatus && fkStatus.foreign_keys === 1) {
        db.run("PRAGMA foreign_keys = ON")
      }

      migrationLog.info(`Successfully migrated table: ${tableName}`)
    } catch (error) {
      migrationLog.error(`Migration failed for table ${tableName}: ${error}`)
      throw error
    }
  })()
}

/**
 * Check if migration is needed and perform if necessary
 */
export function checkAndMigrate(
  db: Database,
  tableName: string,
  newColumns: Record<string, ColumnDefinition>,
  migrationLog: SqliteLogger,
  options?: MigrationOptions,
  tableConstraints: string[] = []
): boolean {
  const logger = new SqliteLogger(tableName, migrationLog.getBaseLogger())

  if (!tableExists(db, tableName)) {
    return false // No existing table, no migration needed
  }

  const currentSchema = getTableColumns(db, tableName)

  if (schemasAreDifferent(currentSchema, newColumns, logger)) {
    migrateTable(db, tableName, newColumns, options, tableConstraints, migrationLog)
    return true
  }

  return false
}
