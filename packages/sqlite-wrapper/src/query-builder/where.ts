import type { SQLQueryBindings } from "bun:sqlite"
import type { RegexCondition, WhereCondition } from "../types"
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
export class WhereQueryBuilder<T extends Record<string, unknown>> extends BaseQueryBuilder<T> {
  // ===== Private Helpers =====

  protected logWhere(method: string, data: Record<string, unknown>): void {
    const parts = Object.entries(data).map(
      ([key, value]) => `${key}=${WhereQueryBuilder.safeStringify(value)}`
    )
    this.log.info(`${method} | ${parts.join(" ")}`)
  }

  protected logWhereState(method: string, extra: Record<string, unknown> = {}): void {
    this.logWhere(method, {
      whereConditions: this.state.whereConditions,
      whereParams: this.state.whereParams,
      ...extra,
    })
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
    }

    // Also remove any regex conditions for this column
    this.state.regexConditions = this.state.regexConditions.filter(
      (cond) => String(cond.column) !== column
    )
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

  // Helper to stringify values safely (converts RegExp to string and falls back)
  protected static safeStringify(obj: unknown): string {
    try {
      const dat = JSON.stringify(obj, (_k, v) => (v instanceof RegExp ? v.toString() : v))
      return truncate(dat, 100)
    } catch {
      return truncate(String(obj), 100)
    }
  }

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
  where(conditions: WhereCondition<T>): this {
    this.logWhere("where", { conditions })

    for (const [column, value] of Object.entries(conditions)) {
      this.removeExistingCondition(column)

      if (value === null || value === undefined) {
        this.state.whereConditions.push(`${quoteIdentifier(column)} IS NULL`)
      } else {
        this.state.whereConditions.push(`${quoteIdentifier(column)} = ?`)
        this.state.whereParams.push(this.toSqliteValue(value))
      }
    }

    this.logWhereState("where")
    return this
  }

  /**
   * Add regex conditions (applied client-side after SQL execution)
   *
   * @example
   * .whereRgx({ email: /@gmail\.com$/ })
   */
  whereRgx(conditions: RegexCondition<T>): this {
    // Log invocation with a safe serializer for regex values
    this.log.info(`whereRgx | conditions=${WhereQueryBuilder.safeStringify(conditions)}`)

    for (const [column, value] of Object.entries(conditions)) {
      this.removeExistingCondition(column)

      if (value instanceof RegExp) {
        this.state.regexConditions.push({
          column: column as keyof T,
          regex: value,
        })
      } else if (typeof value === "string") {
        this.state.regexConditions.push({
          column: column as keyof T,
          regex: new RegExp(value),
        })
      } else if (value !== null && value !== undefined) {
        // Fall back to equality check for non-regex values
        this.state.whereConditions.push(`${quoteIdentifier(column)} = ?`)
        this.state.whereParams.push(value as SQLQueryBindings)
      }
    }

    // Log resulting WHERE/regex state
    this.logWhereState("whereRgx", { regexConditions: this.state.regexConditions })

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
    // Log invocation
    this.log.info(`whereExpr | expr=${expr} params=${WhereQueryBuilder.safeStringify(params)}`)

    if (!expr || typeof expr !== "string") {
      throw new Error("whereExpr: expression must be a non-empty string")
    }

    // Wrap in parentheses to preserve grouping
    this.state.whereConditions.push(`(${expr})`)

    if (params.length > 0) {
      this.state.whereParams.push(...params)
    }

    // Log resulting WHERE clause state
    this.log.info(
      `whereExpr | whereConditions=${WhereQueryBuilder.safeStringify(this.state.whereConditions)} params=${WhereQueryBuilder.safeStringify(
        this.state.whereParams
      )}`
    )

    return this
  }

  /**
   * Alias for whereExpr
   */
  whereRaw(expr: string, params: SQLQueryBindings[] = []): this {
    // Log alias invocation
    this.log.info(`whereRaw | expr=${expr} params=${WhereQueryBuilder.safeStringify(params)}`)
    return this.whereExpr(expr, params)
  }

  /**
   * Add an IN clause
   *
   * @example
   * .whereIn("status", ["active", "pending"])
   * // WHERE "status" IN (?, ?)
   */
  whereIn(column: keyof T, values: SQLQueryBindings[]): this {
    // Log invocation
    this.log.info(
      `whereIn | column=${String(column)} values=${WhereQueryBuilder.safeStringify(values)}`
    )

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("whereIn: values must be a non-empty array")
    }

    this.removeExistingCondition(String(column), "IN")

    const { sql, params } = buildInClause(String(column), values, false)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    // Log resulting WHERE clause state
    this.log.info(
      `whereIn | whereConditions=${WhereQueryBuilder.safeStringify(this.state.whereConditions)} params=${WhereQueryBuilder.safeStringify(
        this.state.whereParams
      )}`
    )

    return this
  }

  /**
   * Add a NOT IN clause
   *
   * @example
   * .whereNotIn("role", ["banned", "suspended"])
   * // WHERE "role" NOT IN (?, ?)
   */
  whereNotIn(column: keyof T, values: SQLQueryBindings[]): this {
    // Log invocation
    this.log.info(
      `whereNotIn | column=${String(column)} values=${WhereQueryBuilder.safeStringify(values)}`
    )

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("whereNotIn: values must be a non-empty array")
    }

    this.removeExistingCondition(String(column), "NOT IN")

    const { sql, params } = buildInClause(String(column), values, true)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    // Log resulting WHERE clause state
    this.log.info(
      `whereNotIn | whereConditions=${WhereQueryBuilder.safeStringify(this.state.whereConditions)} params=${WhereQueryBuilder.safeStringify(
        this.state.whereParams
      )}`
    )

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
  whereOp(column: keyof T, op: string, value: SQLQueryBindings): this {
    const columnStr = String(column)
    this.logWhere("whereOp", { column: columnStr, op, value })

    const normalizedOp = normalizeOperator(op)

    if (value === null || value === undefined) {
      if (normalizedOp === "=" || normalizedOp === "IS") {
        this.state.whereConditions.push(`${quoteIdentifier(columnStr)} IS NULL`)
        this.logWhere("whereOp", { column: columnStr, added: "IS NULL" })
        return this
      }
      if (normalizedOp === "!=" || normalizedOp === "<>" || normalizedOp === "IS NOT") {
        this.state.whereConditions.push(`${quoteIdentifier(columnStr)} IS NOT NULL`)
        this.logWhere("whereOp", { column: columnStr, added: "IS NOT NULL" })
        return this
      }
    }

    this.state.whereConditions.push(`${quoteIdentifier(columnStr)} ${normalizedOp} ?`)
    this.state.whereParams.push(value)

    this.logWhereState("whereOp")
    return this
  }

  /**
   * Add a BETWEEN clause
   *
   * @example
   * .whereBetween("age", 18, 65)
   * // WHERE "age" BETWEEN ? AND ?
   */
  whereBetween(column: keyof T, min: SQLQueryBindings, max: SQLQueryBindings): this {
    // Log invocation
    this.log.info(
      `whereBetween | column=${String(column)} min=${WhereQueryBuilder.safeStringify(min)} max=${WhereQueryBuilder.safeStringify(
        max
      )}`
    )

    this.removeExistingCondition(String(column), "BETWEEN")

    const { sql, params } = buildBetweenClause(String(column), min, max, false)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    // Log resulting WHERE clause state
    this.log.info(
      `whereBetween | whereConditions=${WhereQueryBuilder.safeStringify(this.state.whereConditions)} params=${WhereQueryBuilder.safeStringify(
        this.state.whereParams
      )}`
    )

    return this
  }

  /**
   * Add a NOT BETWEEN clause
   *
   * @example
   * .whereNotBetween("score", 0, 50)
   * // WHERE "score" NOT BETWEEN ? AND ?
   */
  whereNotBetween(column: keyof T, min: SQLQueryBindings, max: SQLQueryBindings): this {
    // Log invocation
    this.log.info(
      `whereNotBetween | column=${String(column)} min=${WhereQueryBuilder.safeStringify(min)} max=${WhereQueryBuilder.safeStringify(
        max
      )}`
    )

    this.removeExistingCondition(String(column), "NOT BETWEEN")

    const { sql, params } = buildBetweenClause(String(column), min, max, true)
    this.state.whereConditions.push(sql)
    this.state.whereParams.push(...params)

    // Log resulting WHERE clause state
    this.log.info(
      `whereNotBetween | whereConditions=${WhereQueryBuilder.safeStringify(this.state.whereConditions)} params=${WhereQueryBuilder.safeStringify(
        this.state.whereParams
      )}`
    )

    return this
  }

  /**
   * Add an IS NULL condition
   *
   * @example
   * .whereNull("deleted_at")
   * // WHERE "deleted_at" IS NULL
   */
  whereNull(column: keyof T): this {
    // Log invocation
    this.log.info(`whereNull | column=${String(column)}`)

    this.removeExistingCondition(String(column))
    this.state.whereConditions.push(`${quoteIdentifier(String(column))} IS NULL`)

    // Log resulting WHERE clause state
    this.log.info(
      `whereNull | whereConditions=${WhereQueryBuilder.safeStringify(this.state.whereConditions)} params=${WhereQueryBuilder.safeStringify(
        this.state.whereParams
      )}`
    )

    return this
  }

  /**
   * Add an IS NOT NULL condition
   *
   * @example
   * .whereNotNull("email")
   * // WHERE "email" IS NOT NULL
   */
  whereNotNull(column: keyof T): this {
    // Log invocation
    this.log.info(`whereNotNull | column=${String(column)}`)

    this.removeExistingCondition(String(column))
    this.state.whereConditions.push(`${quoteIdentifier(String(column))} IS NOT NULL`)

    // Log resulting WHERE clause state
    this.log.info(
      `whereNotNull | whereConditions=${WhereQueryBuilder.safeStringify(this.state.whereConditions)} params=${WhereQueryBuilder.safeStringify(
        this.state.whereParams
      )}`
    )

    return this
  }
}
