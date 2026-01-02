import type { Database, SQLQueryBindings } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { Parser, QueryBuilderState } from "../types"
import {
  createLogger,
  quoteIdentifier,
  type RowData,
  transformFromDb,
  transformRowsFromDb,
  transformToDb,
} from "../utils"

/**
 * Base QueryBuilder class that manages core state and shared functionality.
 *
 * This class provides the foundation for all query operations including:
 * - Database connection and table name management
 * - WHERE clause building and management
 * - Regex condition handling (client-side filtering)
 * - Row transformation (JSON/Boolean serialization)
 */
export abstract class BaseQueryBuilder<T extends Record<string, unknown>> {
  protected state: QueryBuilderState<T>
  protected log: ReturnType<typeof createLogger>

  constructor(db: Database, tableName: string, parser?: Parser<T>, baseLogger?: Logger) {
    this.state = {
      db,
      tableName,
      whereConditions: [],
      whereParams: [],
      regexConditions: [],
      parser,
    }

    // If a base logger is provided, this will inherit the consumer's LogHook/parents.
    this.log = createLogger("Query", baseLogger)

    this.log.debug(`QueryBuilder initialized for table: ${tableName}`)
  }

  // ===== State Accessors =====

  /**
   * Get the database instance
   */
  protected getDb(): Database {
    return this.state.db
  }

  /**
   * Get the table name
   */
  protected getTableName(): string {
    return this.state.tableName
  }

  /**
   * Get the parser configuration
   */
  protected getParser(): Parser<T> | undefined {
    return this.state.parser
  }

  // ===== State Management =====

  /**
   * Reset query builder state to initial values
   */
  protected reset(): void {
    this.state.whereConditions = []
    this.state.whereParams = []
    this.state.regexConditions = []

    // Reset any additional state in subclasses
    if ("orderColumn" in this) this.orderColumn = undefined
    if ("orderDirection" in this) this.orderDirection = "ASC"
    if ("limitValue" in this) this.limitValue = undefined
    if ("offsetValue" in this) this.offsetValue = undefined
    if ("selectedColumns" in this) this.selectedColumns = ["*"]
  }

  /**
   * Reset only WHERE conditions (useful for reusing builder)
   */
  protected resetWhereConditions(): void {
    this.state.whereConditions = []
    this.state.whereParams = []
    this.state.regexConditions = []
  }

  // ===== SQL Building Helpers =====

  /**
   * Quote a SQL identifier to prevent injection
   */
  protected quoteIdentifier(identifier: string): string {
    return quoteIdentifier(identifier)
  }

  /**
   * Build the WHERE clause from accumulated conditions
   *
   * @returns Tuple of [whereClause, parameters]
   */
  protected buildWhereClause(): [string, SQLQueryBindings[]] {
    if (this.state.whereConditions.length === 0) {
      return ["", []]
    }

    const clause = ` WHERE ${this.state.whereConditions.join(" AND ")}`
    const params = [...this.state.whereParams]

    return [clause, params]
  }

  // ===== Regex Condition Handling =====

  /**
   * Check if there are any regex conditions requiring client-side filtering
   */
  protected hasRegexConditions(): boolean {
    return this.state.regexConditions.length > 0
  }

  /**
   * Apply regex filtering to rows (client-side)
   */
  protected applyRegexFiltering(rows: T[]): T[] {
    if (!this.hasRegexConditions()) {
      return rows
    }

    return rows.filter((row) =>
      this.state.regexConditions.every(({ column, regex }) => {
        const value = row[String(column)]
        if (value === null || value === undefined) return false
        return regex.test(String(value))
      })
    )
  }

  // ===== Validation =====

  /**
   * Validate that WHERE conditions exist for destructive operations
   *
   * @throws Error if no WHERE conditions are present
   */
  protected requireWhereClause(operation: string): void {
    const hasWhere = this.state.whereConditions.length > 0
    const hasRegex = this.state.regexConditions.length > 0

    if (!hasWhere && !hasRegex) {
      const message =
        `${operation} requires at least one WHERE condition. ` +
        `Use where(), whereRaw(), whereIn(), whereOp(), or whereRgx().`
      this.log.error(message)
      throw new Error(message)
    }
  }

  // ===== Row Transformation =====

  /**
   * Transform a single row FROM the database
   * (deserialize JSON, convert booleans, etc.)
   */
  protected transformRowFromDb(row: unknown): T {
    return transformFromDb<T>(row, { parser: this.state.parser })
  }

  /**
   * Transform multiple rows FROM the database
   */
  protected transformRowsFromDb(rows: unknown[]): T[] {
    return transformRowsFromDb<T>(rows, { parser: this.state.parser })
  }

  /**
   * Transform a row TO the database
   * (serialize JSON, stringify functions, etc.)
   */
  protected transformRowToDb(row: Partial<T>): RowData {
    return transformToDb<T>(row, { parser: this.state.parser })
  }
}
