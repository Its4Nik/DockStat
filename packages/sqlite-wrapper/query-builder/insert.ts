import type { SQLQueryBindings } from "bun:sqlite"
import type { InsertOptions, InsertResult } from "../types"
import {
  buildPlaceholders,
  createLogger,
  quoteIdentifier,
  quoteIdentifiers,
  type RowData,
} from "../utils"
import { WhereQueryBuilder } from "./where"

/**
 * InsertQueryBuilder - Handles INSERT operations with conflict resolution
 *
 * Features:
 * - Single and bulk inserts
 * - Conflict resolution (OR IGNORE, OR REPLACE, etc.)
 * - Insert and get (returns inserted row)
 * - Batch inserts with transaction support
 * - Automatic JSON/Boolean serialization
 */
export class InsertQueryBuilder<T extends Record<string, unknown>> extends WhereQueryBuilder<T> {
  private insertLog = createLogger("insert")

  // ===== Private Helpers =====

  /**
   * Get the conflict resolution clause for INSERT statements
   */
  private getConflictClause(options?: InsertOptions): string {
    if (!options) return "INSERT"
    if (options.orIgnore) return "INSERT OR IGNORE"
    if (options.orReplace) return "INSERT OR REPLACE"
    if (options.orAbort) return "INSERT OR ABORT"
    if (options.orFail) return "INSERT OR FAIL"
    if (options.orRollback) return "INSERT OR ROLLBACK"
    return "INSERT"
  }

  /**
   * Extract unique columns from a set of rows
   */
  private extractColumns(rows: RowData[]): string[] {
    const columnSet = new Set<string>()

    for (const row of rows) {
      for (const col of Object.keys(row)) {
        columnSet.add(col)
      }
    }

    return Array.from(columnSet)
  }

  /**
   * Build an INSERT query
   */
  private buildInsertQuery(columns: string[], options?: InsertOptions): string {
    const conflictClause = this.getConflictClause(options)
    const tableName = quoteIdentifier(this.getTableName())
    const columnList = quoteIdentifiers(columns)
    const placeholders = buildPlaceholders(columns)

    return `${conflictClause} INTO ${tableName} (${columnList}) VALUES (${placeholders})`
  }

  /**
   * Execute insert for a single row
   */
  private executeInsert(
    query: string,
    row: RowData,
    columns: string[]
  ): { insertId: number; changes: number } {
    const values = columns.map((col) => row[col] ?? null) as SQLQueryBindings[]

    const result = this.getDb()
      .prepare(query)
      .run(...values)

    return {
      insertId: result.lastInsertRowid ? Number(result.lastInsertRowid) : 0,
      changes: result.changes,
    }
  }

  // ===== Public Insert Methods =====

  /**
   * Insert a single row or multiple rows into the table
   *
   * @example
   * // Single insert
   * table.insert({ name: "Alice", email: "alice@example.com" })
   *
   * @example
   * // Multiple inserts
   * table.insert([
   *   { name: "Alice", email: "alice@example.com" },
   *   { name: "Bob", email: "bob@example.com" }
   * ])
   */
  insert(data: Partial<T> | Partial<T>[], options?: InsertOptions): InsertResult {
    const rows = Array.isArray(data) ? data : [data]

    if (rows.length === 0) {
      throw new Error("insert: data cannot be empty")
    }

    // Transform rows (serialize JSON, etc.)
    const transformedRows = rows.map((row) => this.transformRowToDb(row))

    // Extract columns from all rows
    const columns = this.extractColumns(transformedRows)

    if (columns.length === 0) {
      throw new Error("insert: no columns to insert")
    }

    // Build and execute query
    const query = this.buildInsertQuery(columns, options)

    this.insertLog.query("INSERT", query)

    let totalChanges = 0
    let lastInsertId = 0

    for (const row of transformedRows) {
      const result = this.executeInsert(query, row, columns)
      totalChanges += result.changes
      if (result.insertId > 0) {
        lastInsertId = result.insertId
      }
    }

    this.insertLog.result("INSERT", totalChanges)
    this.reset()

    return {
      insertId: lastInsertId,
      changes: totalChanges,
    }
  }

  /**
   * Insert with OR IGNORE conflict resolution
   *
   * Ignores the insert if it would violate a constraint
   */
  insertOrIgnore(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orIgnore: true })
  }

  /**
   * Insert with OR REPLACE conflict resolution
   *
   * Replaces the existing row if a constraint is violated
   */
  insertOrReplace(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orReplace: true })
  }

  /**
   * Insert with OR ABORT conflict resolution
   *
   * Aborts the current SQL statement on constraint violation (default behavior)
   */
  insertOrAbort(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orAbort: true })
  }

  /**
   * Insert with OR FAIL conflict resolution
   *
   * Fails the current SQL statement on constraint violation
   */
  insertOrFail(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orFail: true })
  }

  /**
   * Insert with OR ROLLBACK conflict resolution
   *
   * Rolls back the entire transaction on constraint violation
   */
  insertOrRollback(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orRollback: true })
  }

  /**
   * Insert a row and return the inserted row with all fields
   *
   * Useful when you want to see auto-generated values (ID, timestamps, etc.)
   *
   * @example
   * const user = table.insertAndGet({ name: "Alice", email: "alice@example.com" })
   * console.log(user.id) // Auto-generated ID
   */
  insertAndGet(data: Partial<T>, options?: InsertOptions): T | null {
    const result = this.insert(data, options)

    if (result.changes === 0 || result.insertId <= 0) {
      return null
    }

    // Fetch the inserted row by rowid
    try {
      const query = `SELECT * FROM ${quoteIdentifier(this.getTableName())} WHERE rowid = ?`
      const row = this.getDb().prepare(query).get(result.insertId) as T | null

      return row ? this.transformRowFromDb(row) : null
    } catch {
      // If fetching by rowid fails (e.g., WITHOUT ROWID table), return null
      return null
    }
  }

  /**
   * Batch insert with transaction support
   *
   * Wraps multiple inserts in a transaction for better performance
   * and atomicity when inserting large amounts of data.
   *
   * @example
   * table.insertBatch([
   *   { name: "User 1", email: "user1@example.com" },
   *   { name: "User 2", email: "user2@example.com" },
   *   { name: "User 3", email: "user3@example.com" },
   * ])
   */
  insertBatch(rows: Partial<T>[], options?: InsertOptions): InsertResult {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("insertBatch: rows must be a non-empty array")
    }

    const db = this.getDb()

    // Use a transaction for batch operations
    const transaction = db.transaction((rowsToInsert: Partial<T>[]) => {
      // Transform all rows
      const transformedRows = rowsToInsert.map((row) => this.transformRowToDb(row))

      // Extract columns from all rows
      const columns = this.extractColumns(transformedRows)

      if (columns.length === 0) {
        throw new Error("insertBatch: no columns to insert")
      }

      // Build query and prepare statement
      const query = this.buildInsertQuery(columns, options)
      const stmt = db.prepare(query)

      this.insertLog.query("INSERT BATCH", query)

      let totalChanges = 0
      let lastInsertId = 0

      // Execute for each row
      for (const row of transformedRows) {
        const values = columns.map((col) => row[col] ?? null) as SQLQueryBindings[]
        const result = stmt.run(...values)

        totalChanges += result.changes
        if (result.lastInsertRowid) {
          lastInsertId = Number(result.lastInsertRowid)
        }
      }

      return { insertId: lastInsertId, changes: totalChanges }
    })

    const result = transaction(rows)

    this.insertLog.result("INSERT BATCH", result.changes)
    this.reset()

    return result
  }
}
