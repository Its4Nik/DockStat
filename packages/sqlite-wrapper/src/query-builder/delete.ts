import type { Database, SQLQueryBindings } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { DeleteResult, Parser } from "../types"
import { quoteIdentifier } from "../utils"
import { SelectQueryBuilder } from "./select"

/**
 * DeleteQueryBuilder - Handles DELETE operations with safety checks
 *
 * Features:
 * - Safe deletes (WHERE required to prevent accidental full-table deletes)
 * - Soft delete (mark as deleted instead of removing)
 * - Restore soft deleted rows
 * - Delete and get (returns deleted rows)
 * - Batch deletes with transaction support
 * - Delete older than timestamp
 * - Delete duplicates
 * - Truncate (explicit full-table delete)
 */
export class DeleteQueryBuilder<T extends Record<string, unknown>> extends SelectQueryBuilder<
  T,
  T
> {
  private deleteLog: Logger

  constructor(db: Database, tableName: string, parser: Parser<T>, baseLogger: Logger) {
    super(db, tableName, parser, baseLogger)
    this.deleteLog = this.log.spawn("DELETE")
  }

  // ===== Public Delete Methods =====

  /**
   * Delete rows matching the WHERE conditions
   *
   * Requires at least one WHERE condition to prevent accidental full-table deletes.
   *
   * @example
   * table.where({ id: 1 }).delete()
   *
   * @example
   * table.where({ active: false, deleted_at: null }).delete()
   */
  delete(): DeleteResult {
    this.requireWhereClause("DELETE")

    // Handle regex conditions by fetching matching rows first
    if (this.hasRegexConditions()) {
      return this.deleteWithRegexConditions()
    }

    // Build DELETE statement
    const [whereClause, whereParams] = this.buildWhereClause()
    const query = `DELETE FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

    this.logWithTable("info", "DELETE", `Executing | Where params: ${whereParams.length}`)
    this.deleteLog.debug(`SQL: ${query}`)

    const result = this.getDb()
      .prepare(query)
      .run(...whereParams)

    this.logWithTable("info", "DELETE", `Completed | Deleted: ${result.changes}`)
    this.reset()

    return { changes: result.changes }
  }

  /**
   * Handle DELETE when regex conditions are present
   *
   * Since regex conditions are applied client-side, we need to:
   * 1. Fetch all rows matching SQL conditions
   * 2. Filter with regex client-side
   * 3. Delete each matching row by rowid
   */
  private deleteWithRegexConditions(): DeleteResult {
    // Get rows matching SQL conditions (without regex)
    // Use alias for rowid to avoid collision with INTEGER PRIMARY KEY columns
    const [whereClause, whereParams] = this.buildWhereClause()
    const selectQuery = `SELECT rowid as _rowid_, * FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

    this.logWithTable(
      "debug",
      "DELETE",
      `Fetching candidates for regex filter | Where params: ${whereParams.length}`
    )

    const candidateRows = this.getDb()
      .prepare(selectQuery)
      .all(...whereParams) as (T & { _rowid_: number })[]

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows)

    if (matchingRows.length === 0) {
      this.logWithTable("info", "DELETE", `No matches found via regex filter`)
      this.reset()
      return { changes: 0 }
    }

    this.logWithTable("info", "DELETE", `Deleting ${matchingRows.length} rows via regex filter`)

    // Delete each matching row by rowid
    const deleteQuery = `DELETE FROM ${quoteIdentifier(this.getTableName())} WHERE rowid = ?`
    const stmt = this.getDb().prepare(deleteQuery)

    let totalChanges = 0

    for (const row of matchingRows) {
      const result = stmt.run(row._rowid_ as SQLQueryBindings)
      totalChanges += result.changes
    }

    this.logWithTable("info", "DELETE", `Completed via regex | Deleted: ${totalChanges}`)
    this.reset()

    return { changes: totalChanges }
  }

  /**
   * Delete rows and return the deleted rows
   *
   * Useful for logging or audit purposes.
   *
   * @example
   * const deletedUsers = table.where({ active: false }).deleteAndGet()
   * console.log(`Deleted ${deletedUsers.length} inactive users`)
   */
  deleteAndGet(): T[] {
    // Preserve WHERE state before all() resets it
    const savedWhereConditions = [...this.state.whereConditions]
    const savedWhereParams = [...this.state.whereParams]
    const savedRegexConditions = [...this.state.regexConditions]

    this.logWithTable("debug", "DELETE_AND_GET", `Fetching rows before delete`)

    // Get rows before deletion
    const rowsToDelete = this.all()

    // Restore WHERE state for the delete
    this.state.whereConditions = savedWhereConditions
    this.state.whereParams = savedWhereParams
    this.state.regexConditions = savedRegexConditions

    // Perform the delete
    const deleteResult = this.delete()

    if (deleteResult.changes === 0) {
      this.logWithTable("info", "DELETE_AND_GET", `No rows deleted`)
      return []
    }

    this.logWithTable("info", "DELETE_AND_GET", `Returning ${rowsToDelete.length} deleted rows`)
    return rowsToDelete
  }

  /**
   * Soft delete - mark rows as deleted instead of removing them
   *
   * Sets a timestamp column to mark rows as deleted.
   * Useful for data recovery and audit trails.
   *
   * @example
   * // Using default column name 'deleted_at'
   * table.where({ id: 1 }).softDelete()
   *
   * @example
   * // Using custom column name and value
   * table.where({ id: 1 }).softDelete("removed_at", Date.now())
   */
  softDelete(
    deletedColumn: keyof T = "deleted_at" as keyof T,
    deletedValue: SQLQueryBindings = Math.floor(Date.now() / 1000)
  ): DeleteResult {
    this.requireWhereClause("SOFT DELETE")

    // Handle regex conditions
    if (this.hasRegexConditions()) {
      return this.softDeleteWithRegexConditions(deletedColumn, deletedValue)
    }

    // Build UPDATE statement to mark as deleted
    const [whereClause, whereParams] = this.buildWhereClause()
    const query = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${quoteIdentifier(String(deletedColumn))} = ?${whereClause}`
    const params = [deletedValue, ...whereParams] as SQLQueryBindings[]

    this.logWithTable(
      "info",
      "SOFT_DELETE",
      `Executing | Column: ${String(deletedColumn)} | Where params: ${whereParams.length}`
    )
    this.deleteLog.debug(`SQL: ${query}`)

    const result = this.getDb()
      .prepare(query)
      .run(...params)

    this.logWithTable("info", "SOFT_DELETE", `Completed | Marked as deleted: ${result.changes}`)
    this.reset()

    return { changes: result.changes }
  }

  /**
   * Handle soft delete when regex conditions are present
   */
  private softDeleteWithRegexConditions(
    deletedColumn: keyof T,
    deletedValue: SQLQueryBindings
  ): DeleteResult {
    // Get rows matching SQL conditions (without regex)
    // Use alias for rowid to avoid collision with INTEGER PRIMARY KEY columns
    const [whereClause, whereParams] = this.buildWhereClause()
    const selectQuery = `SELECT rowid as _rowid_, * FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

    this.logWithTable(
      "debug",
      "SOFT_DELETE",
      `Fetching candidates for regex filter | Where params: ${whereParams.length}`
    )

    const candidateRows = this.getDb()
      .prepare(selectQuery)
      .all(...whereParams) as (T & { _rowid_: number })[]

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows)

    if (matchingRows.length === 0) {
      this.logWithTable("info", "SOFT_DELETE", `No matches found via regex filter`)
      this.reset()
      return { changes: 0 }
    }

    this.logWithTable(
      "info",
      "SOFT_DELETE",
      `Soft deleting ${matchingRows.length} rows via regex filter`
    )

    // Soft delete each matching row by rowid
    const updateQuery = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${quoteIdentifier(String(deletedColumn))} = ? WHERE rowid = ?`
    const stmt = this.getDb().prepare(updateQuery)

    let totalChanges = 0

    for (const row of matchingRows) {
      const result = stmt.run(deletedValue, row._rowid_ as SQLQueryBindings)
      totalChanges += result.changes
    }

    this.logWithTable(
      "info",
      "SOFT_DELETE",
      `Completed via regex | Marked as deleted: ${totalChanges}`
    )
    this.reset()

    return { changes: totalChanges }
  }

  /**
   * Restore soft deleted rows by clearing the deleted marker
   *
   * @example
   * // Restore using default column name 'deleted_at'
   * table.where({ id: 1 }).restore()
   *
   * @example
   * // Restore using custom column name
   * table.where({ email: "user@example.com" }).restore("removed_at")
   */
  restore(deletedColumn: keyof T = "deleted_at" as keyof T): DeleteResult {
    this.requireWhereClause("RESTORE")

    // Handle regex conditions
    if (this.hasRegexConditions()) {
      return this.restoreWithRegexConditions(deletedColumn)
    }

    // Build UPDATE statement to clear the deleted marker
    const [whereClause, whereParams] = this.buildWhereClause()
    const query = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${quoteIdentifier(String(deletedColumn))} = NULL${whereClause}`

    this.logWithTable(
      "info",
      "RESTORE",
      `Executing | Column: ${String(deletedColumn)} | Where params: ${whereParams.length}`
    )
    this.deleteLog.debug(`SQL: ${query}`)

    const result = this.getDb()
      .prepare(query)
      .run(...whereParams)

    this.logWithTable("info", "RESTORE", `Completed | Restored: ${result.changes}`)
    this.reset()

    return { changes: result.changes }
  }

  /**
   * Handle restore when regex conditions are present
   */
  private restoreWithRegexConditions(deletedColumn: keyof T): DeleteResult {
    // Get rows matching SQL conditions (without regex)
    // Use alias for rowid to avoid collision with INTEGER PRIMARY KEY columns
    const [whereClause, whereParams] = this.buildWhereClause()
    const selectQuery = `SELECT rowid as _rowid_, * FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

    this.logWithTable(
      "debug",
      "RESTORE",
      `Fetching candidates for regex filter | Where params: ${whereParams.length}`
    )

    const candidateRows = this.getDb()
      .prepare(selectQuery)
      .all(...whereParams) as (T & { _rowid_: number })[]

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows)

    if (matchingRows.length === 0) {
      this.logWithTable("info", "RESTORE", `No matches found via regex filter`)
      this.reset()
      return { changes: 0 }
    }

    this.logWithTable("info", "RESTORE", `Restoring ${matchingRows.length} rows via regex filter`)

    // Restore each matching row by rowid
    const updateQuery = `UPDATE ${quoteIdentifier(this.getTableName())} SET ${quoteIdentifier(String(deletedColumn))} = NULL WHERE rowid = ?`
    const stmt = this.getDb().prepare(updateQuery)

    let totalChanges = 0

    for (const row of matchingRows) {
      const result = stmt.run(row._rowid_ as SQLQueryBindings)
      totalChanges += result.changes
    }

    this.logWithTable("info", "RESTORE", `Completed via regex | Restored: ${totalChanges}`)
    this.reset()

    return { changes: totalChanges }
  }

  /**
   * Batch delete multiple sets of rows based on different conditions
   *
   * Each condition set deletes rows matching those conditions.
   * All deletes are wrapped in a transaction for atomicity.
   *
   * @example
   * table.deleteBatch([
   *   { id: 1 },
   *   { id: 2 },
   *   { email: "deleted@example.com" },
   * ])
   */
  deleteBatch(conditions: Array<Partial<T>>): DeleteResult {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      throw new Error("deleteBatch: conditions must be a non-empty array")
    }

    this.logWithTable("info", "DELETE_BATCH", `Starting | Batch size: ${conditions.length}`)

    const db = this.getDb()

    const transaction = db.transaction((conditionsToProcess: Array<Partial<T>>) => {
      let totalChanges = 0
      let processedCount = 0

      for (const whereData of conditionsToProcess) {
        // Build WHERE conditions for this delete
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
          throw new Error("deleteBatch: each delete must have WHERE conditions")
        }

        // Build DELETE statement
        const whereClause = ` WHERE ${whereConditions.join(" AND ")}`
        const query = `DELETE FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

        const result = db.prepare(query).run(...whereParams)
        totalChanges += result.changes
        processedCount++
      }

      this.deleteLog.debug(
        `Processed ${processedCount}/${conditionsToProcess.length} deletes in transaction`
      )
      return { changes: totalChanges }
    })

    const result = transaction(conditions)

    this.logWithTable("info", "DELETE_BATCH", `Completed | Total deleted: ${result.changes}`)
    this.reset()

    return result
  }

  /**
   * Truncate the entire table (delete all rows)
   *
   * This bypasses the WHERE condition requirement since it's explicitly destructive.
   * USE WITH EXTREME CAUTION!
   *
   * @example
   * // Delete all rows from the table
   * table.truncate()
   */
  truncate(): DeleteResult {
    const query = `DELETE FROM ${quoteIdentifier(this.getTableName())}`

    this.logWithTable("warn", "TRUNCATE", `Executing | CAUTION: Deleting all rows`)
    this.deleteLog.debug(`SQL: ${query}`)

    const result = this.getDb().prepare(query).run()

    this.logWithTable("warn", "TRUNCATE", `Completed | Deleted: ${result.changes}`)
    this.reset()

    return { changes: result.changes }
  }

  /**
   * Delete rows older than a specified timestamp
   *
   * Convenience method for common cleanup operations.
   *
   * @example
   * // Delete rows older than 24 hours
   * table.deleteOlderThan("created_at", Date.now() - 86400000)
   *
   * @example
   * // Delete rows older than 30 days (Unix timestamp)
   * const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
   * table.deleteOlderThan("timestamp", thirtyDaysAgo)
   */
  deleteOlderThan(timestampColumn: keyof T, olderThan: number): DeleteResult {
    this.logWithTable(
      "debug",
      "DELETE_OLDER_THAN",
      `Executing | Column: ${String(timestampColumn)} | Older than: ${olderThan}`
    )
    return this.whereOp(timestampColumn, "<", olderThan).delete()
  }

  /**
   * Delete duplicate rows based on specified columns
   *
   * Keeps the row with the minimum rowid for each unique combination.
   * Useful for data cleanup operations.
   *
   * @example
   * // Delete duplicate emails, keeping the first occurrence
   * table.deleteDuplicates(["email"])
   *
   * @example
   * // Delete rows with duplicate name+email combinations
   * table.deleteDuplicates(["name", "email"])
   */
  deleteDuplicates(columns: Array<keyof T>): DeleteResult {
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error("deleteDuplicates: columns must be a non-empty array")
    }

    const quotedColumns = columns.map((col) => quoteIdentifier(String(col))).join(", ")
    const tableName = quoteIdentifier(this.getTableName())

    // Delete all rows except the one with minimum rowid for each unique combination
    const query = `
      DELETE FROM ${tableName}
      WHERE rowid NOT IN (
        SELECT MIN(rowid)
        FROM ${tableName}
        GROUP BY ${quotedColumns}
      )
    `.trim()

    this.logWithTable("info", "DELETE_DUPLICATES", `Executing | Columns: ${quotedColumns}`)
    this.deleteLog.debug(`SQL: ${query}`)

    const result = this.getDb().prepare(query).run()

    this.logWithTable(
      "info",
      "DELETE_DUPLICATES",
      `Completed | Deleted duplicates: ${result.changes}`
    )
    this.reset()

    return { changes: result.changes }
  }
}
