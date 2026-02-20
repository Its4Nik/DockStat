import type { Database, SQLQueryBindings } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { Parser, UpdateResult } from "../types"
import { buildSetClause, quoteIdentifier, type RowData } from "../utils"
import { SelectQueryBuilder } from "./select"

/**
 * UpdateQueryBuilder - Handles UPDATE operations with safety checks
 *
 * Features:
 * - Safe updates (WHERE required to prevent accidental full-table updates)
 * - Upsert (INSERT OR REPLACE)
 * - Increment/decrement numeric columns
 * - Update and get (returns updated rows)
 * - Batch updates with transaction support
 * - Automatic JSON serialization
 */
export class UpdateQueryBuilder<T extends Record<string, unknown>> extends SelectQueryBuilder<T> {
  private updateLog: Logger

  constructor(db: Database, tableName: string, parser: Parser<T>, baseLogger: Logger) {
    super(db, tableName, parser, baseLogger)
    this.updateLog = baseLogger.spawn("UPDATE")
  }

  // ===== Public Update Methods =====

  /**
   * Update rows matching the WHERE conditions
   *
   * Requires at least one WHERE condition to prevent accidental full-table updates.
   *
   * @example
   * table.where({ id: 1 }).update({ name: "Updated Name" })
   *
   * @example
   * table.where({ active: false }).update({ deleted_at: Date.now() })
   */
  update(data: Partial<T>): UpdateResult {
    this.requireWhereClause("UPDATE")

    // Transform data (serialize JSON, etc.)
    const transformedData = this.transformRowToDb(data)
    const columns = Object.keys(transformedData)

    if (columns.length === 0) {
      this.reset()
      throw new Error("update: no columns to update")
    }

    // Handle regex conditions by fetching matching rows first
    if (this.hasRegexConditions()) {
      return this.updateWithRegexConditions(transformedData)
    }

    // Build UPDATE statement
    const setClause = buildSetClause(columns)
    const [whereClause, whereParams] = this.buildWhereClause()

    const query = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${setClause}${whereClause}`
    const updateValues = columns.map((col) => transformedData[col])
    const allParams = [...updateValues, ...whereParams] as SQLQueryBindings[]

    this.updateLog.info(`Query: ${query} - Params: {allParams}`)

    const result = this.getDb()
      .prepare(query)
      .run(...allParams)

    this.updateLog.info(`Changes: ${result.changes}`)
    this.reset()

    return { changes: result.changes }
  }

  /**
   * Handle UPDATE when regex conditions are present
   *
   * Since regex conditions are applied client-side, we need to:
   * 1. Fetch all rows matching SQL conditions
   * 2. Filter with regex client-side
   * 3. Update each matching row by rowid
   */
  private updateWithRegexConditions(transformedData: RowData): UpdateResult {
    const columns = Object.keys(transformedData)

    // Get rows matching SQL conditions (without regex)
    // Use alias for rowid to avoid collision with INTEGER PRIMARY KEY columns
    const [whereClause, whereParams] = this.buildWhereClause()
    const selectQuery = `SELECT rowid as _rowid_, * FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

    const candidateRows = this.getDb()
      .prepare(selectQuery)
      .all(...whereParams) as (T & { _rowid_: number })[]

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows)

    if (matchingRows.length === 0) {
      this.reset()
      return { changes: 0 }
    }

    // Update each matching row by rowid
    const setClause = buildSetClause(columns)
    const updateQuery = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${setClause} WHERE rowid = ?`
    const stmt = this.getDb().prepare(updateQuery)

    this.updateLog.info(`"UPDATE (regex): Query: ${updateQuery}`)

    let totalChanges = 0
    const updateValues = columns.map((col) => transformedData[col])

    for (const row of matchingRows) {
      const result = stmt.run(...updateValues, row._rowid_ as SQLQueryBindings)
      totalChanges += result.changes
    }

    this.updateLog.info(`Changes: ${totalChanges}`)
    this.reset()

    return { changes: totalChanges }
  }

  /**
   * Upsert (INSERT OR REPLACE) a row
   *
   * If a row with the same unique key exists, it will be replaced.
   * Otherwise, a new row will be inserted.
   *
   * Requires a unique constraint or primary key on the table.
   *
   * @example
   * table.upsert({ email: "alice@example.com", name: "Alice Updated" })
   */
  upsert(data: Partial<T>): UpdateResult {
    const transformedData = this.transformRowToDb(data)
    const columns = Object.keys(transformedData)

    if (columns.length === 0) {
      this.reset()
      throw new Error("upsert: no columns to upsert")
    }

    const columnList = columns.map((col) => quoteIdentifier(col)).join(", ")
    const placeholders = columns.map(() => "?").join(", ")
    const values = columns.map((col) => transformedData[col] ?? null)

    const query = `INSERT OR REPLACE INTO ${quoteIdentifier(this.getTableName())} (${columnList}) VALUES (${placeholders})`

    this.updateLog.info(`UPSERT: Query: ${query} - Values: ${values}`)

    const result = this.getDb()
      .prepare(query)
      .run(...values)

    this.updateLog.info(`Changes: ${result.changes}`)
    this.reset()

    return { changes: result.changes }
  }

  /**
   * Increment a numeric column by a specified amount
   *
   * More efficient than fetching, calculating, and updating.
   *
   * @example
   * table.where({ id: 1 }).increment("login_count")
   * table.where({ id: 1 }).increment("points", 10)
   */
  increment(column: keyof T, amount = 1): UpdateResult {
    this.requireWhereClause("INCREMENT")

    const [whereClause, whereParams] = this.buildWhereClause()
    const quotedColumn = quoteIdentifier(String(column))

    const query = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${quotedColumn} = ${quotedColumn} + ?${whereClause}`
    const params = [amount, ...whereParams] as SQLQueryBindings[]

    this.updateLog.info(`INCREMENT: Query: ${query} - Params: ${params}`)

    const result = this.getDb()
      .prepare(query)
      .run(...params)

    this.updateLog.info(`Changes: ${result.changes}`)
    this.reset()

    return { changes: result.changes }
  }

  /**
   * Decrement a numeric column by a specified amount
   *
   * Equivalent to increment with a negative amount.
   *
   * @example
   * table.where({ id: 1 }).decrement("credits")
   * table.where({ id: 1 }).decrement("stock", 5)
   */
  decrement(column: keyof T, amount = 1): UpdateResult {
    return this.increment(column, -amount)
  }

  /**
   * Update rows and return the updated rows
   *
   * Note: Returns the rows as they were BEFORE the update.
   * For post-update values, query the rows again after updating.
   *
   * @example
   * const updatedRows = table.where({ active: false }).updateAndGet({ deleted: true })
   */
  updateAndGet(data: Partial<T>): T[] {
    // Preserve WHERE state before all() resets it
    const savedWhereConditions = [...this.state.whereConditions]
    const savedWhereParams = [...this.state.whereParams]
    const savedRegexConditions = [...this.state.regexConditions]

    // Get rows before update
    const rowsToUpdate = this.all()

    // Restore WHERE state for the update
    this.state.whereConditions = savedWhereConditions
    this.state.whereParams = savedWhereParams
    this.state.regexConditions = savedRegexConditions

    // Perform the update
    const updateResult = this.update(data)

    if (updateResult.changes === 0) {
      return []
    }

    return rowsToUpdate
  }

  /**
   * Batch update multiple rows with different values
   *
   * Each update item specifies its own WHERE conditions and data.
   * All updates are wrapped in a transaction for atomicity.
   *
   * @example
   * table.updateBatch([
   *   { where: { id: 1 }, data: { name: "Alice" } },
   *   { where: { id: 2 }, data: { name: "Bob" } },
   * ])
   */
  updateBatch(updates: Array<{ where: Partial<T>; data: Partial<T> }>): UpdateResult {
    if (!Array.isArray(updates) || updates.length === 0) {
      this.reset()
      throw new Error("updateBatch: updates must be a non-empty array")
    }

    const db = this.getDb()

    const transaction = db.transaction(
      (updatesToProcess: Array<{ where: Partial<T>; data: Partial<T> }>) => {
        let totalChanges = 0

        for (const { where: whereData, data } of updatesToProcess) {
          // Transform data
          const transformedData = this.transformRowToDb(data)
          const updateColumns = Object.keys(transformedData)

          if (updateColumns.length === 0) {
            continue // Skip empty updates
          }

          // Build WHERE conditions
          const whereConditions: string[] = []
          const whereParams: SQLQueryBindings[] = []

          for (const [column, value] of Object.entries(whereData)) {
            if (value === null || value === undefined) {
              whereConditions.push(`${quoteIdentifier(column)} IS NULL`)
            } else {
              whereConditions.push(`${quoteIdentifier(column)} = ?`)
              whereParams.push(value as SQLQueryBindings)
            }
          }

          if (whereConditions.length === 0) {
            throw new Error("updateBatch: each update must have WHERE conditions")
          }

          // Build UPDATE statement
          const setClause = buildSetClause(updateColumns)
          const whereClause = ` WHERE ${whereConditions.join(" AND ")}`
          const query = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${setClause}${whereClause}`

          const updateValues = updateColumns.map((col) => transformedData[col] ?? null)
          const allParams = [...updateValues, ...whereParams] as SQLQueryBindings[]

          const result = db.prepare(query).run(...allParams)
          totalChanges += result.changes
        }

        return { changes: totalChanges }
      }
    )

    this.updateLog.info(`UPDATE BATCH: ${updates.length} updates`)

    const result = transaction(updates)

    this.updateLog.info(`Changes: ${result.changes}`)
    this.reset()

    return result
  }
}
