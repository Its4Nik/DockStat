import type { Database, SQLQueryBindings } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { ColumnNames, OrderDirection, Parser } from "../types"
import { quoteIdentifier, truncate } from "../utils"
import { JoinQueryBuilder } from "./join"
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
export class SelectQueryBuilder<
  T extends Record<string, unknown>,
  ResultType extends Record<string, unknown> = T,
> extends JoinQueryBuilder<T, ResultType> {
  private selectedColumns: ColumnNames<ResultType> = ["*"]
  private orderColumn?: keyof ResultType
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
  select(columns: ColumnNames<ResultType>): this {
    this.selectedColumns = columns
    return this
  }

  /**
   * Add ORDER BY clause
   *
   * @example
   * .orderBy("created_at")
   */
  orderBy(column: keyof ResultType): this {
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

    // Add JOIN clauses
    const [joinClause, joinParams] = this.buildJoinClause()
    query += joinClause

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

    return [query, [...joinParams, ...whereParams]]
  }

  /**
   * Apply client-side operations (sorting, pagination) when regex filtering is used
   */
  private applyClientSideOperations(rows: ResultType[]): ResultType[] {
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

  /**
   * Log the start of a SELECT operation
   */
  private logSelectStart(
    method: string,
    details: { query?: string; params?: unknown; hasRegex?: boolean }
  ): void {
    const { query, params, hasRegex } = details
    this.logWithTable(
      "debug",
      `SELECT_${method}`,
      `Starting | Params: ${params ? truncate(JSON.stringify(params), 25) : "none"} | Regex: ${hasRegex ? "yes" : "no"}`
    )
    if (query) {
      this.selectLog.debug(`SQL: ${query}`)
    }
  }

  /**
   * Log the result of a SELECT operation
   */
  private logSelectReturn(method: string, details: { returned?: unknown; count?: number }): void {
    const { returned, count } = details
    if (count !== undefined) {
      this.logWithTable("info", `SELECT_${method}`, `Completed | Rows: ${count}`)
    } else {
      this.logWithTable(
        "info",
        `SELECT_${method}`,
        `Completed | Returned: ${WhereQueryBuilder.safeStringify(returned)}`
      )
    }
  }

  // ===== Execution Methods =====

  /**
   * Execute the query and return all matching rows
   *
   * @example
   * const users = table.select(["*"]).where({ active: true }).all()
   */
  all(): ResultType[] {
    const hasRegex = this.hasRegexConditions()
    const [query, params] = this.buildSelectQuery(!hasRegex)

    this.logSelectStart("ALL", { hasRegex, params, query })

    const rows = this.getDb()
      .prepare(query)
      .all(...params) as ResultType[]

    const transformed = this.transformRowsFromDb(rows)
    const result = hasRegex ? this.applyClientSideOperations(transformed) : transformed

    this.logSelectReturn("ALL", { count: result.length })

    this.reset()
    return result
  }

  /**
   * Execute the query and return the first matching row, or null
   *
   * Respects LIMIT if set, otherwise adds LIMIT 1 for efficiency
   */
  get(): ResultType | null {
    if (!this.hasRegexConditions() && this.limitValue === undefined) {
      const [query, params] = this.buildSelectQuery(true)
      const optimizedQuery = `${query} LIMIT 1`

      this.logSelectStart("GET", { params })
      this.selectLog.debug(`SQL (optimized): ${optimizedQuery}`)

      const row = this.getDb()
        .prepare(optimizedQuery)
        .get(...params) as ResultType | null

      const result = row ? this.transformRowFromDb(row) : null
      this.logSelectReturn("GET", { returned: result })

      this.reset()
      return result
    }

    if (!this.hasRegexConditions()) {
      const [query, params] = this.buildSelectQuery(true)

      this.logSelectStart("GET", { hasRegex: false, params, query })

      const row = this.getDb()
        .prepare(query)
        .get(...params) as ResultType | null

      const result = row ? this.transformRowFromDb(row) : null
      this.logSelectReturn("GET", { returned: result })

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
  first(): ResultType | null {
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

      this.logSelectStart("COUNT", { hasRegex: false, params: whereParams })
      this.selectLog.debug(`SQL: ${query}`)

      const result = this.getDb()
        .prepare(query)
        .get(...whereParams) as { __count: number } | null

      const count = result?.__count ?? 0
      this.reset()

      this.logSelectReturn("COUNT", { returned: count })
      return count
    }

    this.logWithTable(
      "info",
      "COUNT",
      `Falling back to client-side counting due to regex conditions`
    )
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

      this.logSelectStart("EXISTS", { hasRegex: false, params: whereParams })
      this.selectLog.debug(`SQL: ${query}`)

      const result = this.getDb()
        .prepare(query)
        .get(...whereParams) as { __exists: number } | null

      const exists = Boolean(result?.__exists)
      this.reset()

      this.logSelectReturn("EXISTS", { returned: exists })
      return exists
    }

    this.logWithTable("info", "EXISTS", `Falling back to client-side check due to regex conditions`)
    return this.count() > 0
  }

  /**
   * Get an array of values from a single column
   *
   * @example
   * const emails = table.where({ active: true }).pluck("email")
   */
  pluck<K extends keyof ResultType>(column: K): ResultType[K][] {
    this.logWithTable("debug", "PLUCK", `Extracting column: ${String(column)}`)

    const rows = this.all() || []
    const values = rows.map((row) => row[column])

    this.logWithTable(
      "info",
      "PLUCK",
      `Completed | Column: ${String(column)} | Values: ${values.length}`
    )
    return values
  }

  /**
   * Get a single column value from the first matching row
   *
   * @example
   * const name = table.where({ id: 1 }).value("name")
   */
  value<K extends keyof ResultType>(column: K): ResultType[K] | null {
    this.logWithTable("debug", "VALUE", `Extracting value from column: ${String(column)}`)

    const row = this.first()
    const value = row ? row[column] : null

    this.logWithTable(
      "info",
      "VALUE",
      `Completed | Column: ${String(column)} | Value: ${WhereQueryBuilder.safeStringify(value)}`
    )
    return value
  }
}
