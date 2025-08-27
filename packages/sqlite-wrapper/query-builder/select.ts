import type { Database, SQLQueryBindings } from 'bun:sqlite'
import type { ColumnNames, JsonColumnConfig, OrderDirection } from '../types'
import { WhereQueryBuilder } from './where'

/**
 * Mixin class that adds SELECT-specific functionality to the QueryBuilder.
 * Handles column selection, ordering, limiting, and result execution methods.
 */
export class SelectQueryBuilder<
  T extends Record<string, unknown>,
> extends WhereQueryBuilder<T> {
  private selectedColumns: ColumnNames<T>
  private orderColumn?: keyof T
  private orderDirection: OrderDirection
  private limitValue?: number
  private offsetValue?: number

  constructor(
    db: Database,
    tableName: string,
    jsonConfig?: JsonColumnConfig<T>
  ) {
    super(db, tableName, jsonConfig)
    this.selectedColumns = ['*']
    this.orderDirection = 'ASC'
  }

  /**
   * Specify which columns to select.
   *
   * @param columns - Array of column names or ["*"] for all columns
   * @returns this for method chaining
   */
  select(columns: ColumnNames<T>): this {
    this.selectedColumns = columns
    return this
  }

  /**
   * Add ORDER BY clause.
   *
   * @param column - Column name to order by
   * @returns this for method chaining
   */
  orderBy(column: keyof T): this {
    this.orderColumn = column
    return this
  }

  /**
   * Set order direction to descending.
   *
   * @returns this for method chaining
   */
  desc(): this {
    this.orderDirection = 'DESC'
    return this
  }

  /**
   * Set order direction to ascending (default).
   *
   * @returns this for method chaining
   */
  asc(): this {
    this.orderDirection = 'ASC'
    return this
  }

  /**
   * Add LIMIT clause.
   *
   * @param amount - Maximum number of rows to return
   * @returns this for method chaining
   */
  limit(amount: number): this {
    if (amount < 0) {
      throw new Error('limit: amount must be non-negative')
    }
    this.limitValue = amount
    return this
  }

  /**
   * Add OFFSET clause.
   *
   * @param start - Number of rows to skip
   * @returns this for method chaining
   */
  offset(start: number): this {
    if (start < 0) {
      throw new Error('offset: start must be non-negative')
    }
    this.offsetValue = start
    return this
  }

  /**
   * Build the complete SELECT query.
   * If regex conditions exist, ORDER/LIMIT/OFFSET are not included in SQL
   * as they will be applied client-side after regex filtering.
   *
   * @param includeOrderAndLimit - Whether to include ORDER/LIMIT/OFFSET in SQL
   * @returns Tuple of [query, parameters]
   */
  private buildSelectQuery(
    includeOrderAndLimit = true
  ): [string, SQLQueryBindings[]] {
    const cols =
      this.selectedColumns[0] === '*'
        ? '*'
        : (this.selectedColumns as string[]).join(', ')

    let query = `SELECT ${cols} FROM ${this.quoteIdentifier(this.getTableName())}`

    const [whereClause, whereParams] = this.buildWhereClause()
    query += whereClause

    if (includeOrderAndLimit && !this.hasRegexConditions()) {
      if (this.orderColumn) {
        query += ` ORDER BY ${String(this.orderColumn)} ${this.orderDirection}`
      }

      if (this.limitValue !== undefined) {
        query += ` LIMIT ${this.limitValue}`
      }

      if (this.offsetValue !== undefined) {
        query += ` OFFSET ${this.offsetValue}`
      }
    }

    return [query, whereParams]
  }

  /**
   * Apply JavaScript-based filtering, ordering, and pagination.
   * Used when regex conditions require client-side processing.
   *
   * @param rows - Rows to process
   * @returns Processed rows
   */
  private applyClientSideOperations(rows: T[]): T[] {
    if (!this.hasRegexConditions()) return rows

    // Apply regex filters
    let filtered = this.applyRegexFiltering(rows)

    // Apply ordering in JavaScript
    if (this.orderColumn) {
      const col = String(this.orderColumn)
      filtered.sort((a: T, b: T) => {
        const va = a[col]
        const vb = b[col]
        if (va === vb) return 0
        if (va === null || va === undefined) return -1
        if (vb === null || vb === undefined) return 1
        if (va < vb) return this.orderDirection === 'ASC' ? -1 : 1
        return this.orderDirection === 'ASC' ? 1 : -1
      })
    }

    // Apply offset & limit in JavaScript
    const start = this.offsetValue ?? 0
    if (this.limitValue !== undefined) {
      filtered = filtered.slice(start, start + this.limitValue)
    } else if (start > 0) {
      filtered = filtered.slice(start)
    }

    return filtered
  }

  /**
   * Execute the query and return all matching rows.
   *
   * @returns Array of rows matching the query
   */
  all(): T[] {
    if (!this.hasRegexConditions()) {
      const [query, params] = this.buildSelectQuery(true)
      this.getLogger().debug(
        `Executing SELECT query - query: ${query}, params: ${JSON.stringify(params)}, hasJsonColumns: ${!!this.state.jsonColumns}`
      )
      const rows = this.getDb()
        .prepare(query)
        .all() as T[]
      this.getLogger().debug(`Retrieved ${rows.length} rows from database`)
      const transformed = this.transformRowsFromDb(rows)
      this.getLogger().debug(`Transformed ${transformed.length} rows`)
      return transformed
    }

    const [query, params] = this.buildSelectQuery(false)
    this.getLogger().debug(
      `Executing SELECT query with regex conditions - query: ${query}, params: ${JSON.stringify(params)}, hasJsonColumns: ${!!this.state.jsonColumns}`
    )
    const rows = this.getDb()
      .prepare(query)
      .all(...params) as T[]
    this.getLogger().debug(`Retrieved ${rows.length} rows for regex filtering`)
    const transformedRows = this.transformRowsFromDb(rows)
    this.getLogger().debug(
      `Transformed ${transformedRows.length} rows for regex filtering`
    )
    return this.applyClientSideOperations(transformedRows)
  }

  /**
   * Execute the query and return the first matching row, or null if none found.
   * If no explicit LIMIT is set, adds LIMIT 1 for efficiency.
   *
   * @returns First matching row or null
   */
  get(): T | null {
    if (!this.hasRegexConditions() && this.limitValue === undefined) {
      // No regex and no explicit limit, we can safely add LIMIT 1
      const [query, params] = this.buildSelectQuery(true)
      const q = query.includes('LIMIT') ? query : `${query} LIMIT 1`
      this.getLogger().debug(
        `Executing single-row SELECT query - query: ${q}, params: ${JSON.stringify(params)}, hasJsonColumns: ${!!this.state.jsonColumns}`
      )
      const row = this.getDb()
        .prepare(q)
        .get(...params) as T | null
      this.getLogger().debug(`Row found: ${row ? 'yes' : 'no'}`)
      const transformed = row ? this.transformRowFromDb(row) : null
      this.getLogger().debug(
        `Transformed row available: ${transformed ? 'yes' : 'no'}`
      )
      return transformed
    }

    if (!this.hasRegexConditions() && this.limitValue !== undefined) {
      // Limit is present; just use the query as-is
      const [query, params] = this.buildSelectQuery(true)
      this.getLogger().debug(
        `get() - path 2: ${JSON.stringify({
          query,
          params,
          hasJsonColumns: !!this.state.jsonColumns,
        })}`
      )
      const row = this.getDb()
        .prepare(query)
        .get(...params) as T | null
      this.getLogger().debug(`raw row (path 2): ${row ? 'found' : 'null'}`)
      const transformed = row ? this.transformRowFromDb(row) : null
      this.getLogger().debug(
        `transformed row (path 2): ${transformed ? 'found' : 'null'}`
      )
      return transformed
    }

    // Has regex conditions, need to process client-side
    this.getLogger().debug('path 3 (regex fallback)')
    const results = this.all()
    return results[0] ?? null
  }

  /**
   * Execute the query and return the first matching row, or null if none found.
   * Always respects the semantics of returning the first row regardless of LIMIT.
   *
   * @returns First matching row or null
   */
  first(): T | null {
    // Temporarily set limit to 1 but preserve previous value
    const prevLimit = this.limitValue
    this.limitValue = 1
    const result = this.get()
    this.limitValue = prevLimit
    return result
  }

  /**
   * Execute a COUNT query and return the number of matching rows.
   * For regex conditions, this fetches all rows and counts client-side.
   *
   * @returns Number of matching rows
   */
  count(): number {
    if (!this.hasRegexConditions()) {
      // Safe to do COUNT(*) in SQL
      const [baseQuery, params] = this.buildSelectQuery(true)
      const countQuery = baseQuery.replace(
        /SELECT (.+?) FROM/i,
        'SELECT COUNT(*) AS __count FROM'
      )
      const result = this.getDb()
        .prepare(countQuery)
        .get(...params) as {
        __count: number
      }
      return result?.__count ?? 0
    }

    // Has regex conditions, count client-side
    return this.all().length
  }

  /**
   * Check if any rows match the current conditions.
   *
   * @returns true if at least one row matches, false otherwise
   */
  exists(): boolean {
    if (!this.hasRegexConditions()) {
      // Use EXISTS for efficiency
      const [baseQuery, params] = this.buildSelectQuery(true)
      const existsQuery = `SELECT EXISTS(${baseQuery}) AS __exists`
      const result = this.getDb()
        .prepare(existsQuery)
        .get(...params) as {
        __exists: number
      }
      return Boolean(result?.__exists)
    }

    // Has regex conditions, check client-side
    return this.count() > 0
  }

  /**
   * Execute the query and return a single column value from the first row.
   * Useful for getting a specific field value.
   *
   * @param column - Column name to extract the value from
   * @returns The value of the specified column from the first row, or null
   */
  value<K extends keyof T>(column: K): T[K] | null {
    const row = this.first()
    return row ? row[column] : null
  }

  /**
   * Execute the query and return an array of values from a single column.
   *
   * @param column - Column name to extract values from
   * @returns Array of values from the specified column
   */
  pluck<K extends keyof T>(column: K): T[K][] {
    const rows = this.all()
    return rows.map((row) => row[column])
  }
}
