import type { SQLQueryBindings } from "bun:sqlite"
import type { ColumnNames, OrderDirection } from "../types"
import { createLogger, quoteIdentifier } from "../utils"
import { WhereQueryBuilder } from "./where"

/**
 * SelectQueryBuilder - Handles SELECT queries with ordering, limiting, and pagination
 *
 * Features:
 * - Column selection (specific columns or *)
 * - ORDER BY with ASC/DESC
 * - LIMIT and OFFSET
 * - Result transformation (JSON/Boolean parsing)
 * - Client-side regex filtering when needed
 */
export class SelectQueryBuilder<T extends Record<string, unknown>> extends WhereQueryBuilder<T> {
  private selectedColumns: ColumnNames<T> = ["*"]
  private orderColumn?: keyof T
  private orderDirection: OrderDirection = "ASC"
  private limitValue?: number
  private offsetValue?: number

  private selectLog = createLogger("select")

  /* constructor(db: Database, tableName: string, parser: Parser<T>) {
    super(db, tableName, parser)
  } */

  // ===== Query Building Methods =====

  /**
   * Specify which columns to select
   *
   * @example
   * .select(["id", "name", "email"])
   * .select(["*"])
   */
  select(columns: ColumnNames<T>): this {
    this.selectedColumns = columns
    return this
  }

  /**
   * Add ORDER BY clause
   *
   * @example
   * .orderBy("created_at")
   */
  orderBy(column: keyof T): this {
    this.orderColumn = column
    return this
  }

  /**
   * Set order direction to descending
   */
  desc(): this {
    this.orderDirection = "DESC"
    return this
  }

  /**
   * Set order direction to ascending (default)
   */
  asc(): this {
    this.orderDirection = "ASC"
    return this
  }

  /**
   * Add LIMIT clause
   *
   * @example
   * .limit(10)
   */
  limit(amount: number): this {
    if (amount < 0) {
      throw new Error("limit: amount must be non-negative")
    }
    this.limitValue = amount
    return this
  }

  /**
   * Add OFFSET clause
   *
   * @example
   * .offset(20)
   */
  offset(start: number): this {
    if (start < 0) {
      throw new Error("offset: start must be non-negative")
    }
    this.offsetValue = start
    return this
  }

  // ===== Private Helpers =====

  /**
   * Build the SELECT query SQL
   */
  private buildSelectQuery(includeOrderAndLimit = true): [string, SQLQueryBindings[]] {
    // Build column list
    const cols =
      this.selectedColumns[0] === "*"
        ? "*"
        : (this.selectedColumns as string[]).map((c) => quoteIdentifier(c)).join(", ")

    // Start with basic SELECT
    let query = `SELECT ${cols} FROM ${quoteIdentifier(this.getTableName())}`

    // Add WHERE clause
    const [whereClause, whereParams] = this.buildWhereClause()
    query += whereClause

    // Add ORDER BY, LIMIT, OFFSET (unless regex conditions require client-side processing)
    if (includeOrderAndLimit && !this.hasRegexConditions()) {
      if (this.orderColumn) {
        query += ` ORDER BY ${quoteIdentifier(String(this.orderColumn))} ${this.orderDirection}`
      }

      if (this.limitValue !== undefined) {
        query += ` LIMIT ${this.limitValue}`
      } else if (this.offsetValue !== undefined) {
        query += ` LIMIT -1`
      }

      if (this.offsetValue !== undefined) {
        query += ` OFFSET ${this.offsetValue}`
      }
    }

    return [query, whereParams]
  }

  /**
   * Apply client-side operations (sorting, pagination) when regex filtering is used
   */
  private applyClientSideOperations(rows: T[]): T[] {
    if (!this.hasRegexConditions()) {
      return rows
    }

    // Apply regex filters first
    let result = this.applyRegexFiltering(rows)

    // Apply ordering
    if (this.orderColumn) {
      const col = String(this.orderColumn)
      const direction = this.orderDirection === "ASC" ? 1 : -1

      result.sort((a, b) => {
        const va = a[col]
        const vb = b[col]

        if (va === vb) return 0
        if (va === null || va === undefined) return -direction
        if (vb === null || vb === undefined) return direction
        if (va < vb) return -direction
        return direction
      })
    }

    // Apply offset and limit
    const start = this.offsetValue ?? 0
    if (this.limitValue !== undefined) {
      result = result.slice(start, start + this.limitValue)
    } else if (start > 0) {
      result = result.slice(start)
    }

    return result
  }

  // ===== Execution Methods =====

  /**
   * Execute the query and return all matching rows
   *
   * @example
   * const users = table.select(["*"]).where({ active: true }).all()
   */
  all(): T[] {
    const hasRegex = this.hasRegexConditions()
    const [query, params] = this.buildSelectQuery(!hasRegex)

    this.selectLog.query("SELECT", query, params)

    const rows = this.getDb()
      .prepare(query)
      .all(...params) as T[]

    this.selectLog.result("SELECT", rows.length)

    // Transform rows (JSON/Boolean parsing)
    const transformed = this.transformRowsFromDb(rows)

    // Apply client-side operations if needed
    const result = hasRegex ? this.applyClientSideOperations(transformed) : transformed

    this.reset()
    return result
  }

  /**
   * Execute the query and return the first matching row, or null
   *
   * Respects LIMIT if set, otherwise adds LIMIT 1 for efficiency
   */
  get(): T | null {
    // If no regex and no explicit limit, optimize with LIMIT 1
    if (!this.hasRegexConditions() && this.limitValue === undefined) {
      const [query, params] = this.buildSelectQuery(true)
      const optimizedQuery = `${query} LIMIT 1`

      this.selectLog.query("SELECT (get)", optimizedQuery, params)

      const row = this.getDb()
        .prepare(optimizedQuery)
        .get(...params) as T | null

      this.selectLog.result("SELECT (get)", row ? 1 : 0)

      const result = row ? this.transformRowFromDb(row) : null
      this.reset()
      return result
    }

    // If limit is set or regex conditions exist, use standard flow
    if (!this.hasRegexConditions()) {
      const [query, params] = this.buildSelectQuery(true)

      this.selectLog.query("SELECT (get)", query, params)

      const row = this.getDb()
        .prepare(query)
        .get(...params) as T | null

      this.selectLog.result("SELECT (get)", row ? 1 : 0)

      const result = row ? this.transformRowFromDb(row) : null
      this.reset()
      return result
    }

    // Has regex conditions - fall back to all() and take first
    const results = this.all()
    return results[0] ?? null
  }

  /**
   * Execute the query and return the first matching row, or null
   * Always applies LIMIT 1 semantics
   */
  first(): T | null {
    const prevLimit = this.limitValue
    this.limitValue = 1
    const result = this.get()
    this.limitValue = prevLimit
    return result
  }

  /**
   * Execute a COUNT query and return the number of matching rows
   */
  count(): number {
    if (!this.hasRegexConditions()) {
      // Use SQL COUNT for efficiency
      const [whereClause, whereParams] = this.buildWhereClause()
      const query = `SELECT COUNT(*) AS __count FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

      this.selectLog.query("COUNT", query, whereParams)

      const result = this.getDb()
        .prepare(query)
        .get(...whereParams) as { __count: number } | null

      this.reset()
      return result?.__count ?? 0
    }

    // Has regex conditions - count client-side
    const results = this.all()
    return results.length
  }

  /**
   * Check if any rows match the current conditions
   */
  exists(): boolean {
    if (!this.hasRegexConditions()) {
      // Use EXISTS for efficiency
      const [whereClause, whereParams] = this.buildWhereClause()
      const subquery = `SELECT 1 FROM ${quoteIdentifier(this.getTableName())}${whereClause} LIMIT 1`
      const query = `SELECT EXISTS(${subquery}) AS __exists`

      this.selectLog.query("EXISTS", query, whereParams)

      const result = this.getDb()
        .prepare(query)
        .get(...whereParams) as { __exists: number } | null

      this.reset()
      return Boolean(result?.__exists)
    }

    // Has regex conditions - check client-side
    return this.count() > 0
  }

  /**
   * Get a single column value from the first matching row
   *
   * @example
   * const name = table.where({ id: 1 }).value("name")
   */
  value<K extends keyof T>(column: K): T[K] | null {
    const row = this.first()
    return row ? row[column] : null
  }

  /**
   * Get an array of values from a single column
   *
   * @example
   * const emails = table.where({ active: true }).pluck("email")
   */
  pluck<K extends keyof T>(column: K): T[K][] {
    const rows = this.all()
    return rows.map((row) => row[column])
  }
}
