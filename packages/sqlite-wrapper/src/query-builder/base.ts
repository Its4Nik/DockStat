import type { Database, SQLQueryBindings } from "bun:sqlite"
import { Logger } from "@dockstat/logger"
import type { Parser, QueryBuilderState } from "../types"
import {
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
export abstract class BaseQueryBuilder<
  T extends Record<string, unknown>,
  ResultType extends Record<string, unknown> = T,
> {
  protected state: QueryBuilderState<T>
  protected log: Logger

  constructor(db: Database, tableName: string, parser?: Parser<T>, baseLogger?: Logger) {
    this.state = {
      db,
      joinClauses: [],
      parser,
      regexConditions: [],
      tableName,
      whereConditions: [],
      whereParams: [],
    }

    // If a base logger is provided, use it directly (it's already the QB logger from QueryBuilder).
    // Otherwise, create a new QB logger.
    this.log = baseLogger || new Logger("QB")

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
    this.log.debug("Resetting QueryBuilder state")

    this.state.whereConditions = []
    this.state.whereParams = []
    this.state.regexConditions = []
    this.state.joinClauses = []

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
    this.log.debug("Resetting Where conditions")
    this.state.whereConditions = []
    this.state.whereParams = []
    this.state.regexConditions = []
  }

  /**
   * Reset only JOIN clauses (useful for reusing builder)
   */
  protected resetJoinClauses(): void {
    this.log.debug("Resetting Join clauses")
    this.state.joinClauses = []
  }

  // ===== SQL Building Helpers =====

  /**
   * Quote a SQL identifier to prevent injection
   */
  protected quoteIdentifier(identifier: string): string {
    this.log.debug("Quoting identifier")
    return quoteIdentifier(identifier)
  }

  /**
   * Build the WHERE clause from accumulated conditions
   *
   * @returns Tuple of [whereClause, parameters]
   */
  protected buildWhereClause(): [string, SQLQueryBindings[]] {
    this.log.debug("Building Where Clause")
    if (this.state.whereConditions.length === 0) {
      return ["", []]
    }

    const clause = ` WHERE ${this.state.whereConditions.join(" AND ")}`
    const params = [...this.state.whereParams]

    return [clause, params]
  }

  /**
   * Build the JOIN clause from accumulated join conditions
   *
   * @returns Tuple of [joinClause, joinParams]
   */
  protected buildJoinClause(): [string, SQLQueryBindings[]] {
    this.log.debug("Building Join Clause")
    if (this.state.joinClauses.length === 0) {
      return ["", []]
    }

    const joinParts: string[] = []
    const params: SQLQueryBindings[] = []

    for (const join of this.state.joinClauses) {
      const { type, table, alias, condition } = join

      // Build table reference with optional alias
      const tableRef = alias
        ? `${quoteIdentifier(table)} AS ${quoteIdentifier(alias)}`
        : quoteIdentifier(table)

      let onClause: string

      // Handle condition type
      if (typeof condition === "string") {
        // Raw expression condition
        onClause = ` ON ${condition}`
      } else {
        // Column mapping condition: { local_column: "foreign_column" }
        // or with explicit table: { "local_table.local_column": "foreign_table.foreign_column" }
        const conditions: string[] = []
        for (const [localRef, foreignRef] of Object.entries(condition)) {
          let localPart: string
          let foreignPart: string

          // Parse local reference (could be "column" or "table.column")
          if (localRef.includes(".")) {
            localPart = localRef
              .split(".")
              .map((p) => quoteIdentifier(p.trim()))
              .join(".")
          } else {
            // Default to main table if no table specified
            localPart = `${quoteIdentifier(this.getTableName())}.${quoteIdentifier(localRef)}`
          }

          // Parse foreign reference (could be "column" or "table.column")
          if (foreignRef.includes(".")) {
            foreignPart = foreignRef
              .split(".")
              .map((p) => quoteIdentifier(p.trim()))
              .join(".")
          } else {
            // Default to the joined table (or alias if provided) if no table specified
            const foreignTable = alias || table
            foreignPart = `${quoteIdentifier(foreignTable)}.${quoteIdentifier(foreignRef)}`
          }

          conditions.push(`${localPart} = ${foreignPart}`)
        }
        onClause = ` ON ${conditions.join(" AND ")}`
      }

      joinParts.push(` ${type} JOIN ${tableRef}${onClause}`)
    }

    return [joinParts.join(""), params]
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
  protected applyRegexFiltering(rows: ResultType[]): ResultType[] {
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
  protected transformRowFromDb(row: unknown): ResultType {
    return transformFromDb<ResultType>(row, {
      logger: this.log,
      parser: this.state.parser as Parser<unknown>,
    })
  }

  /**
   * Transform multiple rows FROM the database
   */
  protected transformRowsFromDb(rows: unknown[]): ResultType[] {
    return transformRowsFromDb<ResultType>(rows, {
      logger: this.log,
      parser: this.state.parser as Parser<unknown>,
    })
  }

  /**
   * Transform a row TO the database
   * (serialize JSON, stringify functions, etc.)
   */
  protected transformRowToDb(row: Partial<T>): RowData {
    return transformToDb<T>(row, { logger: this.log, parser: this.state.parser })
  }
}
