import type { Database, SQLQueryBindings } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { ColumnNames, OrderDirection, Parser } from "../types"
import { quoteIdentifier } from "../utils"
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

  private selectLog: Logger

  constructor(db: Database, tableName: string, parser: Parser<T>, baseLogger: Logger) {
    super(db, tableName, parser, baseLogger)
    this.selectLog = this.log.spawn("SELECT")
  }

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
    this.selectLog.debug("Building select query")

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

  private logSelectStart(
    method: string,
    details: { query?: string; optimizedQuery?: string; params?: unknown }
  ): void {
    const { query, optimizedQuery, params } = details
    const q = query ?? optimizedQuery ?? ""
    this.selectLog.info(
      `${method} | ${query ? "query" : "optimizedQuery"}=${q} params=${WhereQueryBuilder.safeStringify(params)}`
    )
  }

  private logSelectReturn(
    method: string,
    details: { returned?: unknown; length?: number; sample?: unknown }
  ): void {
    const { returned, length, sample } = details
    if (length !== undefined && sample !== undefined) {
      this.selectLog.info(
        `${method} | returned=${length} sample=${WhereQueryBuilder.safeStringify(sample)}`
      )
    } else {
      this.selectLog.info(`${method} | returned=${WhereQueryBuilder.safeStringify(returned)}`)
    }
  }

  // ===== Execution Methods =====

  // Use the protected static helper inherited from WhereQueryBuilder: `safeStringify`
  // (Removed duplicate implementation to avoid static-side conflicts with the base class.)

  /**
   * Execute the query and return all matching rows
   *
   * @example
   * const users = table.select(["*"]).where({ active: true }).all()
   */
  all(): T[] {
    const hasRegex = this.hasRegexConditions()
    const [query, params] = this.buildSelectQuery(!hasRegex)

    this.logSelectStart("all", { query, params })
    this.selectLog.info(`SELECT: Query: ${query} - Params: ${params.join(", ")}`)

    const rows = this.getDb()
      .prepare(query)
      .all(...params) as T[]

    this.selectLog.info(`Found ${rows.length} row${rows.length > 0 ? "s" : ""}`)

    const transformed = this.transformRowsFromDb(rows)
    const result = hasRegex ? this.applyClientSideOperations(transformed) : transformed

    this.logSelectReturn("all", {
      length: result.length,
      sample: result[0] ?? null,
    })

    this.reset()
    return result
  }

  /**
   * Execute the query and return the first matching row, or null
   *
   * Respects LIMIT if set, otherwise adds LIMIT 1 for efficiency
   */
  get(): T | null {
    if (!this.hasRegexConditions() && this.limitValue === undefined) {
      const [query, params] = this.buildSelectQuery(true)
      const optimizedQuery = `${query} LIMIT 1`

      this.logSelectStart("get", { optimizedQuery, params })
      this.selectLog.info(`SELECT (get): Query: ${optimizedQuery} - Params: ${params.join(", ")}`)

      const row = this.getDb()
        .prepare(optimizedQuery)
        .get(...params) as T | null
      this.selectLog.info(row ? "Found row" : "Could not retrieve row")

      const result = row ? this.transformRowFromDb(row) : null
      this.logSelectReturn("get", { returned: result })

      this.reset()
      return result
    }

    if (!this.hasRegexConditions()) {
      const [query, params] = this.buildSelectQuery(true)

      this.logSelectStart("get", { query, params })
      this.selectLog.info(`SELECT (get): Query: ${query} - Params: ${JSON.stringify(params)}`)

      const row = this.getDb()
        .prepare(query)
        .get(...params) as T | null
      this.selectLog.info(`SELECT (get): ${row ? "Found row" : "Could not get row"}`)

      const result = row ? this.transformRowFromDb(row) : null
      this.logSelectReturn("get", { returned: result })

      this.reset()
      return result
    }

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
      const [whereClause, whereParams] = this.buildWhereClause()
      const query = `SELECT COUNT(*) AS __count FROM ${quoteIdentifier(this.getTableName())}${whereClause}`

      this.logSelectStart("count", { query, params: whereParams })
      this.selectLog.info(`COUNT: Query: ${query} - Where: ${whereParams}`)

      const result = this.getDb()
        .prepare(query)
        .get(...whereParams) as { __count: number } | null

      const count = result?.__count ?? 0
      this.reset()

      this.logSelectReturn("count", { returned: count })
      return count
    }

    const results = this.all()
    return results.length
  }

  /**
   * Check if any rows match the current conditions
   */
  exists(): boolean {
    if (!this.hasRegexConditions()) {
      const [whereClause, whereParams] = this.buildWhereClause()
      const subquery = `SELECT 1 FROM ${quoteIdentifier(this.getTableName())}${whereClause} LIMIT 1`
      const query = `SELECT EXISTS(${subquery}) AS __exists`

      this.logSelectStart("exists", { query, params: whereParams })
      this.selectLog.info(`"EXISTS: Query: ${query} - Where: ${whereParams}`)

      const result = this.getDb()
        .prepare(query)
        .get(...whereParams) as { __exists: number } | null

      const exists = Boolean(result?.__exists)
      this.reset()

      this.logSelectReturn("exists", { returned: exists })
      return exists
    }

    return this.count() > 0
  }

  private logColumnReturn(method: "value" | "pluck", column: string, returned: unknown): void {
    this.selectLog.info(
      `${method} | column=${column} returned=${WhereQueryBuilder.safeStringify(returned)}`
    )
  }

  /**
   * Get an array of values from a single column
   *
   * @example
   * const emails = table.where({ active: true }).pluck("email")
   */
  pluck<K extends keyof T>(column: K): T[K][] {
    const rows = this.all() || []
    const values = rows.map((row) => row[column])

    this.logColumnReturn("pluck", String(column), values)
    return values
  }

  /**
   * Get a single column value from the first matching row
   *
   * @example
   * const name = table.where({ id: 1 }).value("name")
   */
  value<K extends keyof T>(column: K): T[K] | null {
    const row = this.first()
    const value = row ? row[column] : null

    this.logColumnReturn("value", String(column), value)
    return value
  }
}
