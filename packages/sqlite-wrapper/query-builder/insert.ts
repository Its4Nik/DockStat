import type { SQLQueryBindings } from "bun:sqlite"
import type { InsertOptions, InsertResult } from "../types"
import { WhereQueryBuilder } from "./where"

/**
 * Mixin class that adds INSERT functionality to the QueryBuilder.
 * Handles single and bulk insert operations with conflict resolution.
 */
export class InsertQueryBuilder<T extends Record<string, unknown>> extends WhereQueryBuilder<T> {
  /**
   * Insert a single row or multiple rows into the table.
   *
   * @param data - Single object or array of objects to insert
   * @param options - Insert options (OR IGNORE, OR REPLACE, etc.)
   * @returns Insert result with insertId and changes count
   */
  insert(data: Partial<T> | Partial<T>[], options?: InsertOptions): InsertResult {
    const truncate = (str: string, max: number) =>
      str.length > max ? `${str.slice(0, max)}...` : str
    this.getLogger("INSERT").debug(`Building Data Array: ${truncate(JSON.stringify(data), 100)}`)
    const rows = Array.isArray(data) ? data : [data]

    // Transform rows to handle JSON serialization
    const transformedRows = rows.map((row) => this.transformRowToDb(row))

    this.getLogger("INSERT").debug(
      `Transformed row: ${truncate(JSON.stringify(transformedRows), 100)}`
    )

    if (transformedRows.length === 0) {
      throw new Error("insert: data cannot be empty")
    }

    // Get all unique columns from all rows
    const allColumns = new Set<string>()
    for (const row of transformedRows) {
      for (const col of Object.keys(row)) {
        allColumns.add(col)
      }
    }

    const columns = Array.from(allColumns)
    if (columns.length === 0) {
      throw new Error("insert: no columns to insert")
    }

    // Build INSERT statement with conflict resolution
    let insertType = "INSERT"
    if (options?.orIgnore) insertType = "INSERT OR IGNORE"
    else if (options?.orReplace) insertType = "INSERT OR REPLACE"
    else if (options?.orAbort) insertType = "INSERT OR ABORT"
    else if (options?.orFail) insertType = "INSERT OR FAIL"
    else if (options?.orRollback) insertType = "INSERT OR ROLLBACK"

    const quotedColumns = columns.map((col) => this.quoteIdentifier(col)).join(", ")
    const placeholders = columns.map(() => "?").join(", ")

    const query = `${insertType} INTO ${this.quoteIdentifier(this.getTableName())} (${quotedColumns}) VALUES (${placeholders})`
    const stmt = this.getDb().prepare(query)

    let totalChanges = 0
    let lastInsertId = 0

    // Execute for each row
    for (const row of transformedRows) {
      const values = columns.map(
        (col) => row[col as keyof typeof row] ?? null
      ) as SQLQueryBindings[]
      const result = stmt.run(...values)
      totalChanges += result.changes
      if (result.lastInsertRowid) {
        lastInsertId = Number(result.lastInsertRowid)
      }
    }

    const result = {
      insertId: lastInsertId,
      changes: totalChanges,
    }
    this.reset()
    return result
  }

  /**
   * Insert with OR IGNORE conflict resolution.
   * Convenience method equivalent to insert(data, { orIgnore: true })
   *
   * @param data - Single object or array of objects to insert
   * @returns Insert result with insertId and changes count
   */
  insertOrIgnore(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orIgnore: true })
  }

  /**
   * Insert with OR REPLACE conflict resolution.
   * Convenience method equivalent to insert(data, { orReplace: true })
   *
   * @param data - Single object or array of objects to insert
   * @returns Insert result with insertId and changes count
   */
  insertOrReplace(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orReplace: true })
  }

  /**
   * Insert with OR ABORT conflict resolution.
   * This is the default behavior but provided for explicit usage.
   *
   * @param data - Single object or array of objects to insert
   * @returns Insert result with insertId and changes count
   */
  insertOrAbort(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orAbort: true })
  }

  /**
   * Insert with OR FAIL conflict resolution.
   *
   * @param data - Single object or array of objects to insert
   * @returns Insert result with insertId and changes count
   */
  insertOrFail(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orFail: true })
  }

  /**
   * Insert with OR ROLLBACK conflict resolution.
   *
   * @param data - Single object or array of objects to insert
   * @returns Insert result with insertId and changes count
   */
  insertOrRollback(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insert(data, { orRollback: true })
  }

  /**
   * Insert and get the inserted row back.
   * This is useful when you want to see the row with auto-generated fields.
   *
   * @param data - Single object to insert (bulk not supported for this method)
   * @param options - Insert options
   * @returns The inserted row with all fields, or null if insertion failed
   */
  insertAndGet(data: Partial<T>, options?: InsertOptions): T | null {
    const result = this.insert(data, options)

    if (result.changes === 0) {
      return null
    }

    // If we have an insertId, try to fetch the inserted row
    if (result.insertId > 0) {
      try {
        const row = this.getDb()
          .prepare(`SELECT * FROM ${this.quoteIdentifier(this.getTableName())} WHERE rowid = ?`)
          .get(result.insertId) as T | null
        return row ? this.transformRowFromDb(row) : null
      } catch {
        // If fetching by rowid fails, return null
        return null
      }
    }

    return null
  }

  /**
   * Batch insert with transaction support.
   * This method wraps multiple inserts in a transaction for better performance
   * and atomicity when inserting large amounts of data.
   *
   * @param rows - Array of objects to insert
   * @param options - Insert options
   * @returns Insert result with total changes
   */
  insertBatch(rows: Partial<T>[], options?: InsertOptions): InsertResult {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("insertBatch: rows must be a non-empty array")
    }

    const db = this.getDb()

    // Use a transaction for batch operations
    const transaction = db.transaction((rowsToInsert: Partial<T>[]) => {
      let totalChanges = 0
      let lastInsertId = 0

      // Transform rows to handle JSON serialization
      const transformedRows = rowsToInsert.map((row) => this.transformRowToDb(row))

      // Get all unique columns from all rows
      const allColumns = new Set<string>()
      for (const row of transformedRows) {
        for (const col of Object.keys(row)) {
          allColumns.add(col)
        }
      }

      const columns = Array.from(allColumns)
      if (columns.length === 0) {
        throw new Error("insertBatch: no columns to insert")
      }

      // Build INSERT statement with conflict resolution
      let insertType = "INSERT"
      if (options?.orIgnore) insertType = "INSERT OR IGNORE"
      else if (options?.orReplace) insertType = "INSERT OR REPLACE"
      else if (options?.orAbort) insertType = "INSERT OR ABORT"
      else if (options?.orFail) insertType = "INSERT OR FAIL"
      else if (options?.orRollback) insertType = "INSERT OR ROLLBACK"

      const quotedColumns = columns.map((col) => this.quoteIdentifier(col)).join(", ")
      const placeholders = columns.map(() => "?").join(", ")

      const query = `${insertType} INTO ${this.quoteIdentifier(this.getTableName())} (${quotedColumns}) VALUES (${placeholders})`
      const stmt = db.prepare(query)

      for (const row of transformedRows) {
        const values = columns.map(
          (col) => row[col as keyof typeof row] ?? null
        ) as SQLQueryBindings[]
        const result = stmt.run(...values)
        totalChanges += result.changes
        if (result.lastInsertRowid) {
          lastInsertId = Number(result.lastInsertRowid)
        }
      }

      return { insertId: lastInsertId, changes: totalChanges }
    })

    const result = transaction(rows)
    this.reset()
    return result
  }
}
