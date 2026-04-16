import type { Database } from "bun:sqlite"
import type { Logger } from "@dockstat/logger"
import type { JoinClause, JoinCondition, JoinType, Parser } from "../types"
import type { QueryBuilder } from "./index"
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
   * @param queryBuilder - The QueryBuilder for the table to join (provides both type and parser)
   * @param condition - Join condition (column mapping or raw expression)
   * @param alias - Optional alias for the joined table
   *
   * @example
   * // Simple column mapping with type inference
   * .join(posts, { "id": "user_id" })
   * // Result type becomes User & Post
   *
   * @example
   * // Column mapping with explicit tables
   * .join(posts, { "users.id": "posts.user_id" })
   *
   * @example
   * // Raw expression
   * .join(posts, "users.id = posts.user_id AND posts.published = 1")
   *
   * @example
   * // With alias
   * .join(posts, { "id": "user_id" }, "p")
   *
   * @returns A new query builder with the merged result type
   * @note The actual type transformation is handled by the main QueryBuilder class
   */
  join<JT extends Record<string, unknown>>(
    queryBuilder: QueryBuilder<JT>,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("INNER", queryBuilder, condition, alias)
  }

  /**
   * Add an INNER JOIN clause
   *
   * Same as join(), but explicitly specifies INNER JOIN.
   */
  innerJoin<JT extends Record<string, unknown>>(
    queryBuilder: QueryBuilder<JT>,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("INNER", queryBuilder, condition, alias)
  }

  /**
   * Add a LEFT JOIN clause
   *
   * @example
   * .leftJoin(posts, { "id": "user_id" })
   * // LEFT JOIN "posts" ON "users"."id" = "posts"."user_id"
   */
  leftJoin<JT extends Record<string, unknown>>(
    queryBuilder: QueryBuilder<JT>,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("LEFT", queryBuilder, condition, alias)
  }

  /**
   * Add a RIGHT JOIN clause
   *
   * @example
   * .rightJoin(comments, { "posts.id": "comment.post_id" })
   * // RIGHT JOIN "comments" ON "posts"."id" = "comments"."post_id"
   */
  rightJoin<JT extends Record<string, unknown>>(
    queryBuilder: QueryBuilder<JT>,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("RIGHT", queryBuilder, condition, alias)
  }

  /**
   * Add a FULL JOIN clause
   *
   * @example
   * .fullJoin(orders, { "customers.id": "orders.customer_id" })
   * // FULL JOIN "orders" ON "customers"."id" = "orders"."customer_id"
   */
  fullJoin<JT extends Record<string, unknown>>(
    queryBuilder: QueryBuilder<JT>,
    condition: JoinCondition,
    alias?: string
  ): this {
    return this.addJoin("FULL", queryBuilder, condition, alias)
  }

  /**
   * Add a CROSS JOIN clause
   *
   * Note: CROSS JOIN does not use an ON clause.
   *
   * @returns A new QueryBuilder with the merged result type (ResultType & JT)
   *
   * @example
   * .crossJoin(products)
   * // CROSS JOIN "products"
   */
  crossJoin<JT extends Record<string, unknown>>(
    queryBuilder: QueryBuilder<JT>,
    alias?: string
  ): this {
    const tableName = queryBuilder.getTableName()
    const parser = queryBuilder.getParser()
    const tableRef = alias ? `${tableName} AS ${alias}` : tableName

    this.logWithTable("info", "CROSS_JOIN", `Adding CROSS JOIN | Table: ${tableRef}`)

    const joinClause: JoinClause = {
      alias,
      condition: "", // CROSS JOIN doesn't use ON clause
      parser: parser as Parser<Record<string, unknown>> | undefined,
      table: tableName,
      type: "CROSS",
    }

    this.state.joinClauses.push(joinClause)
    this.joinLog.debug(`Total JOIN clauses: ${this.state.joinClauses.length}`)

    return this
  }

  /**
   * Internal method to add a join clause
   */
  private addJoin<JT extends Record<string, unknown>>(
    type: JoinType,
    queryBuilder: QueryBuilder<JT>,
    condition: JoinCondition,
    alias?: string
  ): this {
    const tableName = queryBuilder.getTableName()
    const parser = queryBuilder.getParser()
    const tableRef = alias ? `${tableName} AS ${alias}` : tableName
    const conditionStr = typeof condition === "string" ? condition : JSON.stringify(condition)

    this.logWithTable(
      "info",
      `${type}_JOIN`,
      `Adding | Table: ${tableRef} | Condition: ${WhereQueryBuilder.safeStringify(conditionStr)}`
    )

    const joinClause: JoinClause = {
      alias,
      condition,
      parser: parser as Parser<Record<string, unknown>> | undefined,
      table: tableName,
      type,
    }

    this.state.joinClauses.push(joinClause)
    this.joinLog.debug(`Total JOIN clauses: ${this.state.joinClauses.length}`)

    return this
  }
}
