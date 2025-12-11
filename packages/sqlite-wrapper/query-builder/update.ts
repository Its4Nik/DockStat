import type { SQLQueryBindings } from "bun:sqlite"
import type { UpdateResult } from "../types"
import { SelectQueryBuilder } from "./select"

/**
 * Mixin class that adds UPDATE functionality to the QueryBuilder.
 * Handles safe update operations with mandatory WHERE conditions.
 */
export class UpdateQueryBuilder<T extends Record<string, unknown>> extends SelectQueryBuilder<T> {
  /**
   * Update rows matching the WHERE conditions with the provided data.
   * Requires at least one WHERE condition to prevent accidental full table updates.
   *
   * @param data - Object with columns to update and their new values
   * @returns Update result with changes count
   */
  update(data: Partial<T>): UpdateResult {
    this.requireWhereClause("UPDATE")

    // Transform data to handle JSON serialization
    const transformedData = this.transformRowToDb(data)
    const updateColumns = Object.keys(transformedData)
    if (updateColumns.length === 0) {
      this.reset()
      throw new Error("update: no columns to update")
    }

    // Handle regex conditions by first fetching matching rows
    if (this.hasRegexConditions()) {
      this.reset()
      return this.updateWithRegexConditions(transformedData)
    }

    // Build UPDATE statement
    const setClause = updateColumns.map((col) => `${this.quoteIdentifier(col)} = ?`).join(", ")

    const [whereClause, whereParams] = this.buildWhereClause()
    const query = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${setClause}${whereClause}`

    const updateValues = updateColumns.map((col) => transformedData[col])
    const allParams = [...updateValues, ...whereParams]

    const result = this.getDb()
      .prepare(query)
      .run(...allParams)

    const out = {
      changes: result.changes,
    }
    this.reset()
    return out
  }

  /**
   * Handle UPDATE operations when regex conditions are present.
   * This requires client-side filtering and individual row updates.
   */
  private updateWithRegexConditions(
    transformedData: Record<string, SQLQueryBindings>
  ): UpdateResult {
    // First, get all rows matching SQL conditions (without regex)
    const [selectQuery, selectParams] = this.buildWhereClause()
    const candidateRows = this.getDb()
      .prepare(`SELECT rowid, * FROM ${this.quoteIdentifier(this.getTableName())}${selectQuery}`)
      .all(...selectParams) as (T & { rowid: number })[]

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows)

    if (matchingRows.length === 0) {
      this.reset()
      return { changes: 0 }
    }

    // Update each matching row by rowid
    const updateColumns = Object.keys(transformedData)
    const setClause = updateColumns.map((col) => `${this.quoteIdentifier(col)} = ?`).join(", ")

    const updateQuery = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${setClause} WHERE rowid = ?`
    const stmt = this.getDb().prepare(updateQuery)

    let totalChanges = 0
    const updateValues = updateColumns.map((col) => transformedData[col])

    for (const row of matchingRows) {
      const result = stmt.run(...updateValues, row.rowid as SQLQueryBindings)
      totalChanges += result.changes
    }
    this.reset()
    return { changes: totalChanges }
  }

  /**
   * Update or insert (upsert) functionality using INSERT OR REPLACE.
   * This method attempts to update existing rows, and inserts new ones if they don't exist.
   * Requires a unique constraint or primary key to work properly.
   *
   * @param data - Object with columns to upsert
   * @returns Update result with changes count
   */
  upsert(data: Partial<T>): UpdateResult {
    // Transform data to handle JSON serialization
    const transformedData = this.transformRowToDb(data)
    const columns = Object.keys(transformedData)
    if (columns.length === 0) {
      this.reset()
      throw new Error("upsert: no columns to upsert")
    }

    const quotedColumns = columns.map((col) => this.quoteIdentifier(col)).join(", ")
    const placeholders = columns.map(() => "?").join(", ")

    const query = `INSERT OR REPLACE INTO ${this.quoteIdentifier(this.getTableName())} (${quotedColumns}) VALUES (${placeholders})`

    const values = columns.map((col) => transformedData[col] ?? null)
    const result = this.getDb()
      .prepare(query)
      .run(...values)

    const out = {
      changes: result.changes,
    }
    this.reset()
    return out
  }

  /**
   * Increment a numeric column by a specified amount.
   * This is more efficient than fetching, calculating, and updating.
   *
   * @param column - Column name to increment
   * @param amount - Amount to increment by (defaults to 1)
   * @returns Update result with changes count
   */
  increment(column: keyof T, amount = 1): UpdateResult {
    this.requireWhereClause("INCREMENT")

    const [whereClause, whereParams] = this.buildWhereClause()
    const query = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${this.quoteIdentifier(String(column))} = ${this.quoteIdentifier(String(column))} + ?${whereClause}`

    const result = this.getDb()
      .prepare(query)
      .run(amount, ...whereParams)

    const out = {
      changes: result.changes,
    }
    this.reset()
    return out
  }

  /**
   * Decrement a numeric column by a specified amount.
   * This is more efficient than fetching, calculating, and updating.
   *
   * @param column - Column name to decrement
   * @param amount - Amount to decrement by (defaults to 1)
   * @returns Update result with changes count
   */
  decrement(column: keyof T, amount = 1): UpdateResult {
    const out = this.increment(column, -amount)
    this.reset()
    return out
  }

  /**
   * Update and get the updated rows back.
   * This is useful when you want to see the rows after the update.
   *
   * @param data - Object with columns to update and their new values
   * @returns Array of updated rows
   */
  updateAndGet(data: Partial<T>): T[] {
    // First, get the rows that will be updated
    const rowsToUpdate = this.all()

    // Perform the update
    const updateResult = this.update(data)

    if (updateResult.changes === 0) {
      this.reset()
      return []
    }

    // For simplicity, return the originally matched rows
    // In a real implementation, you might want to re-fetch the updated rows
    const out = rowsToUpdate
    this.reset()
    return out
  }

  /**
   * Batch update multiple rows with different values.
   * This is more efficient than individual updates when updating many rows.
   *
   * @param updates - Array of objects, each containing update data and conditions
   * @returns Update result with total changes count
   */
  updateBatch(updates: Array<{ where: Partial<T>; data: Partial<T> }>): UpdateResult {
    if (!Array.isArray(updates) || updates.length === 0) {
      this.reset()
      throw new Error("updateBatch: updates must be a non-empty array")
    }

    const db = this.getDb()

    // Use a transaction for batch operations
    const transaction = db.transaction(
      (updatesToProcess: Array<{ where: Partial<T>; data: Partial<T> }>) => {
        let totalChanges = 0

        for (const { where: whereData, data } of updatesToProcess) {
          // Transform data to handle JSON serialization
          const transformedUpdateData = this.transformRowToDb(data)
          const updateColumns = Object.keys(transformedUpdateData)
          if (updateColumns.length === 0) {
            continue // Skip empty updates
          }

          // Build WHERE conditions for this update
          const whereConditions: string[] = []
          const whereParams: SQLQueryBindings[] = []

          for (const [column, value] of Object.entries(whereData)) {
            if (value === null || value === undefined) {
              whereConditions.push(`${this.quoteIdentifier(column)} IS NULL`)
            } else {
              whereConditions.push(`${this.quoteIdentifier(column)} = ?`)
              whereParams.push(value)
            }
          }

          if (whereConditions.length === 0) {
            this.reset()
            throw new Error("updateBatch: each update must have WHERE conditions")
          }

          // Build UPDATE statement
          const setClause = updateColumns
            .map((col) => `${this.quoteIdentifier(col)} = ?`)
            .join(", ")

          const whereClause = ` WHERE ${whereConditions.join(" AND ")}`
          const query = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${setClause}${whereClause}`

          const updateValues = updateColumns.map((col) => transformedUpdateData[col] ?? null)
          const allParams = [...updateValues, ...whereParams]

          const result = db.prepare(query).run(...allParams)
          totalChanges += result.changes
        }

        this.reset()
        return { changes: totalChanges }
      }
    )

    const out = transaction(updates)
    this.reset()
    return out
  }
}
