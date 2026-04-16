import type { Database, SQLQueryBindings } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { JoinClause, JoinCondition, JoinType, Parser } from "../types"
import { quoteIdentifier } from "../utils"
import { WhereQueryBuilder } from "./where"

/**
 * JoinQueryBuilder - Adds JOIN clause functionality to the QueryBuilder
 *
 * Provides methods for building SQL JOIN clauses:
 * - INNER JOIN (default)
 * - LEFT JOIN
 * - RIGHT JOIN
 * - FULL JOIN
 * - CROSS JOIN
 *
 * Join conditions can be specified as:
 * - Column mapping: { "local_column": "foreign_column" }
 * - Column mapping with tables: { "local_table.local_column": "foreign_table.foreign_column" }
 * - Raw expression: "users.id = posts.user_id AND posts.published = 1"
 *
 * @template T - The original table type
 * @template ResultType - The current query result type (defaults to T, updates with each join)
 */
export class JoinQueryBuilder<
  T extends Record<string, unknown>,
  ResultType extends Record<string, unknown> = T,
> extends WhereQueryBuilder<T, ResultType> {
  private joinLog: Logger

  constructor(db: Database, tableName: string, parser: Parser<T>, baseLogger: Logger) {
    super(db, tableName, parser, baseLogger)
    this.joinLog = this.log.spawn("JOIN")
  }

  /**
   * Add a JOIN clause (default: INNER JOIN)
   *
   * @template JT - The joined table type for type safety
   * @param table - The table to join
   * @param condition - Join condition (column mapping or raw expression)
   * @param alias - Optional alias for the joined table
   *
   * @example
   * // Simple column mapping with type inference
   * .join<Post>("posts", { "id": "user_id" })
   * // Result type becomes User & Post
   *
   * @example
   * // Column mapping with explicit tables
   * .join<Post>("posts", { "users.id": "posts.user_id" })
   *
   * @example
   * // Raw expression
   * .join<Post>("posts", "users.id = posts.user_id AND posts.published = 1")
   *
   * @example
   * // With alias
   * .join<Post>("posts", { "id": "user_id" }, "p")
   *
   * @returns A new query builder with the merged result type
   * @note The actual type transformation is handled by the main QueryBuilder class
   */
  join<JT extends Record<string, unknown>>(
    table: string,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("INNER", table, condition, alias)
  }

  /**
   * Add an INNER JOIN clause
   *
   * Same as join(), but explicitly specifies INNER JOIN.
   *
   * @template JT - The joined table type for type safety
   */
  innerJoin<JT extends Record<string, unknown>>(
    table: string,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("INNER", table, condition, alias)
  }

  /**
   * Add a LEFT JOIN clause
   *
   * @template JT - The joined table type for type safety
   * @example
   * .leftJoin<Post>("posts", { "id": "user_id" })
   * // LEFT JOIN "posts" ON "users"."id" = "posts"."user_id"
   */
  leftJoin<JT extends Record<string, unknown>>(
    table: string,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("LEFT", table, condition, alias)
  }

  /**
   * Add a RIGHT JOIN clause
   *
   * @template JT - The joined table type for type safety
   * @example
   * .rightJoin<Comment>("comments", { "posts.id": "comment.post_id" })
   * // RIGHT JOIN "comments" ON "posts"."id" = "comments"."post_id"
   */
  rightJoin<JT extends Record<string, unknown>>(
    table: string,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("RIGHT", table, condition, alias)
  }

  /**
   * Add a FULL JOIN clause
   *
   * @template JT - The joined table type for type safety
   * @example
   * .fullJoin<Order>("orders", { "customers.id": "orders.customer_id" })
   * // FULL JOIN "orders" ON "customers"."id" = "orders"."customer_id"
   */
  fullJoin<JT extends Record<string, unknown>>(
    table: string,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("FULL", table, condition, alias)
  }

  /**
   * Add a CROSS JOIN clause
   *
   * Note: CROSS JOIN does not use an ON clause.
   *
   * @template JT - The joined table type
   * @returns A new QueryBuilder with the merged result type (ResultType & JT)
   *
   * @example
   * .crossJoin<Product>("products")
   * // CROSS JOIN "products"
   */
  crossJoin<JT extends Record<string, unknown>>(table: string, alias?: string): this {
    const tableRef = alias ? `${table} AS ${alias}` : table

    this.logWithTable("info", "CROSS_JOIN", `Adding CROSS JOIN | Table: ${tableRef}`)

    const joinClause: JoinClause = {
      alias,
      condition: "", // CROSS JOIN doesn't use ON clause
      table,
      type: "CROSS",
    }

    this.state.joinClauses.push(joinClause)
    this.joinLog.debug(`Total JOIN clauses: ${this.state.joinClauses.length}`)

    return this
  }

  /**
   * Internal method to add a join clause
   */
  private addJoin(type: JoinType, table: string, condition: JoinCondition, alias?: string): this {
    const tableRef = alias ? `${table} AS ${alias}` : table
    const conditionStr = typeof condition === "string" ? condition : JSON.stringify(condition)

    this.logWithTable(
      "info",
      `${type}_JOIN`,
      `Adding | Table: ${tableRef} | Condition: ${WhereQueryBuilder.safeStringify(conditionStr)}`
    )

    const joinClause: JoinClause = {
      alias,
      condition,
      table,
      type,
    }

    this.state.joinClauses.push(joinClause)
    this.joinLog.debug(`Total JOIN clauses: ${this.state.joinClauses.length}`)

    return this
  }

  /**
   * Check if there are any join clauses
   */
  protected hasJoins(): boolean {
    return this.state.joinClauses.length > 0
  }
}
