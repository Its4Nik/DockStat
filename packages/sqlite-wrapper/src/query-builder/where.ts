import type { Database, SQLQueryBindings } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { Parser, RegexCondition, WhereCondition } from "../types"
import {
  buildBetweenClause,
  buildInClause,
  normalizeOperator,
  quoteIdentifier,
  truncate,
} from "../utils"
import { BaseQueryBuilder } from "./base"

/**
 * WhereQueryBuilder - Adds WHERE clause functionality to the QueryBuilder
 *
 * Provides methods for building SQL WHERE conditions:
 * - Simple equality conditions
 * - Comparison operators
 * - IN/NOT IN clauses
 * - BETWEEN clauses
 * - NULL checks
 * - Raw SQL expressions
 * - Regex conditions (client-side filtering)
 */
export class WhereQueryBuilder<
  T extends Record<string, unknown>,
  ResultType extends Record<string, unknown> = T,
> extends BaseQueryBuilder<T, ResultType> {
  private whereLog: Logger

  constructor(db: Database, tableName: string, parser: Parser<T>, baseLogger: Logger) {
    super(db, tableName, parser, baseLogger)
    this.whereLog = this.log.spawn("WHERE")
  }

  /**
   * Helper to stringify values safely (converts RegExp to string and falls back)
   */
  protected static safeStringify(obj: unknown): string {
    try {
      const dat = JSON.stringify(obj, (_k, v) => (v instanceof RegExp ? v.toString() : v))
      return truncate(dat, 100)
    } catch {
      return truncate(String(obj), 100)
    }
  }

  /**
   * Remove an existing condition for a column to prevent duplicates
   */
  private removeExistingCondition(column: string, operation?: string): void {
    const columnPattern = operation ? `${column} ${operation}` : `${column} `

    const existingIndex = this.state.whereConditions.findIndex(
      (condition) => condition.startsWith(columnPattern) || condition.startsWith(`"${column}"`)
    )

    if (existingIndex !== -1) {
      this.state.whereConditions.splice(existingIndex, 1)
      // Remove corresponding params if they exist
      if (existingIndex < this.state.whereParams.length) {
        this.state.whereParams.splice(existingIndex, 1)
      }
      this.whereLog.debug(`Removed existing condition for column: ${column}`)
    }

    // Also remove any regex conditions for this column
    const regexCountBefore = this.state.regexConditions.length
    this.state.regexConditions = this.state.regexConditions.filter(
      (cond) => String(cond.column) !== column
    )
    if (this.state.regexConditions.length < regexCountBefore) {
      this.whereLog.debug(`Removed regex condition for column: ${column}`)
    }
  }

  /**
   * Convert a JavaScript value to SQLite-compatible value
   */
  private toSqliteValue(value: unknown): SQLQueryBindings {
    if (typeof value === "boolean") {
      return value ? 1 : 0
    }
    return value as SQLQueryBindings
  }

  // ===== Public WHERE Methods =====

  /**
   * Add simple equality conditions to the WHERE clause
   *
   * @example
   * .where({ name: "Alice", active: true })
   * // WHERE "name" = ? AND "active" = ?
   *
   * @example
   * .where({ deleted_at: null })
   * // WHERE "deleted_at" IS NULL
   */
  where(conditions: WhereCondition<ResultType>): this {
    const conditionKeys = Object.keys(conditions)

    if (conditionKeys.length === 0) {
      this.logWithTable("debug", "WHERE", "No conditions provided, skipping")
      return this
    }

    this.logWithTable("info", "WHERE", `Adding ${conditionKeys.length} condition(s)`)

    for (const [column, value] of Object.entries(conditions)) {
      this.removeExistingCondition(column)

      if (value === null || value === undefined) {
        this.state.whereConditions.push(`${quoteIdentifier(column)} IS NULL`)
        this.whereLog.debug(`Added NULL check for column: ${column}`)
      } else {
        this.state.whereConditions.push(`${quoteIdentifier(column)} = ?`)
        this.state.whereParams.push(this.toSqliteValue(value))
        this.whereLog.debug(`Added equality condition for column: ${column}`)
      }
    }

    this.logWithTable(
      "debug",
      "WHERE",
      `Total conditions: ${this.state.whereConditions.length} | Params: ${this.state.whereParams.length}`
    )
    return this
  }

  /**
   * Add regex conditions (applied client-side after SQL execution)
   *
   * @example
   * .whereRgx({ email: /@gmail\.com$/ })
   */
  whereRgx(conditions: RegexCondition<ResultType>): this {
    const conditionKeys = Object.keys(conditions)

    if (conditionKeys.length === 0) {
      this.logWithTable("debug", "WHERE_RGX", "No regex conditions provided, skipping")
      return this
    }

    this.logWithTable(
      "info",
      "WHERE_RGX",
      `Adding ${conditionKeys.length} regex condition(s) (client-side filtering)`
    )

    for (const [column, value] of Object.entries(conditions)) {
      this.removeExistingCondition(column)

      if (value instanceof RegExp) {
        this.state.regexConditions.push({
          column: String(column),
          regex: value,
        })
        this.whereLog.debug(`Added regex condition for column: ${column} | Pattern: ${value}`)
      } else if (typeof value === "string") {
        const regex = new RegExp(value)
        this.state.regexConditions.push({
          column: String(column),
          regex,
        })
        this.whereLog.debug(`Added regex condition for column: ${column} | Pattern: ${value}`)
      } else if (value !== null && value !== undefined) {
        // Fall back to equality check for non-regex values
        this.state.whereConditions.push(`${quoteIdentifier(column)} = ?`)
        this.state.whereParams.push(value as SQLQueryBindings)
        this.whereLog.debug(`Added equality check (non-regex) for column: ${column}`)
      }
    }

    this.logWithTable(
      "debug",
      "WHERE_RGX",
      `Total regex conditions: ${this.state.regexConditions.length}`
    )
    return this
  }

  /**
   * Add a raw SQL WHERE expression with parameter binding
   *
   * @example
   * .whereExpr("LENGTH(name) > ?", [5])
   * .whereExpr("created_at > datetime('now', '-1 day')")
   */
  whereExpr(expr: string, params: SQLQueryBindings[] = []): this {
    if (!expr || typeof expr !== "string") {
      this.logWithTable("error", "WHERE_EXPR", "Expression must be a non-empty string")
      throw new Error("whereExpr: expression must be a non-empty string")
    }

    this.logWithTable("info", "WHERE_EXPR", `Adding raw expression | Params: ${params.length}`)

    // Wrap in parentheses to preserve grouping
    this.state.whereConditions.push(`(${expr})`)

    if (params.length > 0) {
      this.state.whereParams.push(...params)
      this.whereLog.debug(`Added ${params.length} parameter(s) to expression`)
    }

    this.logWithTable("debug", "WHERE_EXPR", `Expression added successfully`)
    return this
  }

  /**
   * Alias for whereExpr
   */
  whereRaw(expr: string, params: SQLQueryBindings[] = []): this {
    this.logWithTable("debug", "WHERE_RAW", "Alias for whereExpr called")
    return this.whereExpr(expr, params)
  }

  /**
   * Add an IN clause
   *
   * @example
   * .whereIn("status", ["active", "pending"])
   * // WHERE "status" IN (?, ?)
   */
  whereIn(column: keyof ResultType, values: SQLQueryBindings[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      this.logWithTable("error", "WHERE_IN", "Values must be a non-empty array")
      throw new Error("whereIn: values must be a non-empty array")
    }

    this.logWithTable(
      "info",
      "WHERE_IN",
      `Adding IN clause | Column: ${String(column)} | Values: ${values.length}`
    )

    this.removeExistingCondition(String(column), "IN")

    const { sql, params } = buildInClause(String(column), values, false)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    this.logWithTable("debug", "WHERE_IN", `IN clause added successfully`)
    return this
  }

  /**
   * Add a NOT IN clause
   *
   * @example
   * .whereNotIn("role", ["banned", "suspended"])
   * // WHERE "role" NOT IN (?, ?)
   */
  whereNotIn(column: keyof ResultType, values: SQLQueryBindings[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      this.logWithTable("error", "WHERE_NOT_IN", "Values must be a non-empty array")
      throw new Error("whereNotIn: values must be a non-empty array")
    }

    this.logWithTable(
      "info",
      "WHERE_NOT_IN",
      `Adding NOT IN clause | Column: ${String(column)} | Values: ${values.length}`
    )

    this.removeExistingCondition(String(column), "NOT IN")

    const { sql, params } = buildInClause(String(column), values, true)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    this.logWithTable("debug", "WHERE_NOT_IN", `NOT IN clause added successfully`)
    return this
  }

  /**
   * Add a comparison operator condition
   *
   * Supported operators: =, !=, <>, <, <=, >, >=, LIKE, GLOB, IS, IS NOT
   *
   * @example
   * .whereOp("age", ">=", 18)
   * .whereOp("name", "LIKE", "%smith%")
   */
  whereOp(column: keyof ResultType, op: string, value: SQLQueryBindings): this {
    const columnStr = String(column)
    const normalizedOp = normalizeOperator(op)

    this.logWithTable("info", "WHERE_OP", `Adding ${normalizedOp} condition | Column: ${columnStr}`)

    if (value === null || value === undefined) {
      if (normalizedOp === "=" || normalizedOp === "IS") {
        this.removeExistingCondition(columnStr)
        this.state.whereConditions.push(`${quoteIdentifier(columnStr)} IS NULL`)
        this.logWithTable("debug", "WHERE_OP", `Added IS NULL for column: ${columnStr}`)
        return this
      }
      if (normalizedOp === "!=" || normalizedOp === "<>" || normalizedOp === "IS NOT") {
        this.removeExistingCondition(columnStr)
        this.state.whereConditions.push(`${quoteIdentifier(columnStr)} IS NOT NULL`)
        this.logWithTable("debug", "WHERE_OP", `Added IS NOT NULL for column: ${columnStr}`)
        return this
      }
    }

    this.removeExistingCondition(columnStr, normalizedOp)
    this.state.whereConditions.push(`${quoteIdentifier(columnStr)} ${normalizedOp} ?`)
    this.state.whereParams.push(value)

    this.logWithTable(
      "debug",
      "WHERE_OP",
      `Added ${normalizedOp} condition for column: ${columnStr}`
    )
    return this
  }

  /**
   * Add a BETWEEN clause
   *
   * @example
   * .whereBetween("age", 18, 65)
   * // WHERE "age" BETWEEN ? AND ?
   */
  whereBetween(column: keyof ResultType, min: SQLQueryBindings, max: SQLQueryBindings): this {
    const columnStr = String(column)

    this.logWithTable(
      "info",
      "WHERE_BETWEEN",
      `Adding BETWEEN clause | Column: ${columnStr} | Range: ${WhereQueryBuilder.safeStringify(min)} to ${WhereQueryBuilder.safeStringify(max)}`
    )

    this.removeExistingCondition(columnStr, "BETWEEN")

    const { sql, params } = buildBetweenClause(columnStr, min, max, false)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    this.logWithTable("debug", "WHERE_BETWEEN", `BETWEEN clause added successfully`)
    return this
  }

  /**
   * Add a NOT BETWEEN clause
   *
   * @example
   * .whereNotBetween("score", 0, 50)
   * // WHERE "score" NOT BETWEEN ? AND ?
   */
  whereNotBetween(column: keyof ResultType, min: SQLQueryBindings, max: SQLQueryBindings): this {
    const columnStr = String(column)

    this.logWithTable(
      "info",
      "WHERE_NOT_BETWEEN",
      `Adding NOT BETWEEN clause | Column: ${columnStr} | Range: ${WhereQueryBuilder.safeStringify(min)} to ${WhereQueryBuilder.safeStringify(max)}`
    )

    this.removeExistingCondition(columnStr, "NOT BETWEEN")

    const { sql, params } = buildBetweenClause(columnStr, min, max, true)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    this.logWithTable("debug", "WHERE_NOT_BETWEEN", `NOT BETWEEN clause added successfully`)
    return this
  }

  /**
   * Add an IS NULL condition
   *
   * @example
   * .whereNull("deleted_at")
   * // WHERE "deleted_at" IS NULL
   */
  whereNull(column: keyof ResultType): this {
    const columnStr = String(column)

    this.logWithTable("info", "WHERE_NULL", `Adding IS NULL | Column: ${columnStr}`)

    this.removeExistingCondition(columnStr)
    this.state.whereConditions.push(`${quoteIdentifier(columnStr)} IS NULL`)

    this.logWithTable("debug", "WHERE_NULL", `IS NULL condition added`)
    return this
  }

  /**
   * Add an IS NOT NULL condition
   *
   * @example
   * .whereNotNull("email")
   * // WHERE "email" IS NOT NULL
   */
  whereNotNull(column: keyof ResultType): this {
    const columnStr = String(column)

    this.logWithTable("info", "WHERE_NOT_NULL", `Adding IS NOT NULL | Column: ${columnStr}`)

    this.removeExistingCondition(columnStr)
    this.state.whereConditions.push(`${quoteIdentifier(columnStr)} IS NOT NULL`)

    this.logWithTable("debug", "WHERE_NOT_NULL", `IS NOT NULL condition added`)
    return this
  }
}
