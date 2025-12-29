import type { SQLQueryBindings } from "bun:sqlite"

/**
 * SQL Utilities for sqlite-wrapper
 *
 * Common SQL operations and helpers used across the package.
 */

/**
 * Quote a SQL identifier (table name, column name) to prevent injection
 * and handle special characters.
 *
 * @example
 * quoteIdentifier("users") // "users"
 * quoteIdentifier("user name") // "user name"
 * quoteIdentifier('with"quote') // "with""quote"
 */
export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

/**
 * Quote a SQL string literal value
 *
 * @example
 * quoteString("hello") // 'hello'
 * quoteString("it's") // 'it''s'
 */
export function quoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * Build a comma-separated list of quoted identifiers
 *
 * @example
 * quoteIdentifiers(["id", "name", "email"]) // "id", "name", "email"
 */
export function quoteIdentifiers(identifiers: string[]): string {
  return identifiers.map(quoteIdentifier).join(", ")
}

/**
 * Build placeholders for parameterized queries
 *
 * @example
 * buildPlaceholders(3) // "?, ?, ?"
 * buildPlaceholders(["a", "b"]) // "?, ?"
 */
export function buildPlaceholders(countOrArray: number | unknown[]): string {
  const count = typeof countOrArray === "number" ? countOrArray : countOrArray.length
  return Array(count).fill("?").join(", ")
}

/**
 * Build a SET clause for UPDATE statements
 *
 * @example
 * buildSetClause(["name", "email"]) // "name" = ?, "email" = ?
 */
export function buildSetClause(columns: string[]): string {
  return columns.map((col) => `${quoteIdentifier(col)} = ?`).join(", ")
}

/**
 * Build an INSERT statement
 */
export function buildInsertSQL(
  table: string,
  columns: string[],
  conflictResolution?: "IGNORE" | "REPLACE" | "ABORT" | "FAIL" | "ROLLBACK"
): string {
  const insertType = conflictResolution ? `INSERT OR ${conflictResolution}` : "INSERT"
  const quotedColumns = quoteIdentifiers(columns)
  const placeholders = buildPlaceholders(columns)

  return `${insertType} INTO ${quoteIdentifier(table)} (${quotedColumns}) VALUES (${placeholders})`
}

/**
 * Build a simple SELECT statement
 */
export function buildSelectSQL(
  table: string,
  columns: string[] | "*",
  options?: {
    where?: string
    orderBy?: string
    orderDirection?: "ASC" | "DESC"
    limit?: number
    offset?: number
  }
): string {
  const cols = columns === "*" ? "*" : quoteIdentifiers(columns)
  let sql = `SELECT ${cols} FROM ${quoteIdentifier(table)}`

  if (options?.where) {
    sql += ` WHERE ${options.where}`
  }

  if (options?.orderBy) {
    sql += ` ORDER BY ${quoteIdentifier(options.orderBy)} ${options.orderDirection || "ASC"}`
  }

  if (options?.limit !== undefined) {
    sql += ` LIMIT ${options.limit}`
  }

  if (options?.offset !== undefined) {
    sql += ` OFFSET ${options.offset}`
  }

  return sql
}

/**
 * Build an UPDATE statement
 */
export function buildUpdateSQL(table: string, columns: string[], where: string): string {
  const setClause = buildSetClause(columns)
  return `UPDATE ${quoteIdentifier(table)} SET ${setClause} WHERE ${where}`
}

/**
 * Build a DELETE statement
 */
export function buildDeleteSQL(table: string, where: string): string {
  return `DELETE FROM ${quoteIdentifier(table)} WHERE ${where}`
}

/**
 * Check if a string looks like a SQL function call
 *
 * @example
 * isSQLFunction("datetime('now')") // true
 * isSQLFunction("CURRENT_TIMESTAMP") // true
 * isSQLFunction("hello") // false
 */
export function isSQLFunction(value: string): boolean {
  const functionPatterns = [
    /^\w+\s*\(/i, // function(...)
    /^CURRENT_TIME(STAMP)?$/i,
    /^CURRENT_DATE$/i,
    /^NULL$/i,
  ]
  return functionPatterns.some((pattern) => pattern.test(value.trim()))
}

/**
 * Escape a value for safe inclusion in SQL
 * Returns the SQLite-safe representation
 */
export function escapeValue(value: SQLQueryBindings): string {
  if (value === null) return "NULL"
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "1" : "0"
  if (typeof value === "string") return quoteString(value)
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`
  return quoteString(String(value))
}

/**
 * Normalize a comparison operator
 */
export function normalizeOperator(op: string): string {
  const normalized = op.toUpperCase().trim()
  const allowed = ["=", "!=", "<>", "<", "<=", ">", ">=", "LIKE", "GLOB", "IS", "IS NOT"]

  if (!allowed.includes(normalized)) {
    throw new Error(`Invalid SQL operator: "${op}"`)
  }

  return normalized
}

/**
 * Build a WHERE condition for a single column
 */
export function buildCondition(
  column: string,
  operator: string,
  value: SQLQueryBindings | null | undefined
): { sql: string; params: SQLQueryBindings[] } {
  const normalizedOp = normalizeOperator(operator)
  const quotedCol = quoteIdentifier(column)

  // Handle NULL special cases
  if (value === null || value === undefined) {
    if (normalizedOp === "=" || normalizedOp === "IS") {
      return { sql: `${quotedCol} IS NULL`, params: [] }
    }
    if (normalizedOp === "!=" || normalizedOp === "<>" || normalizedOp === "IS NOT") {
      return { sql: `${quotedCol} IS NOT NULL`, params: [] }
    }
  }

  return {
    sql: `${quotedCol} ${normalizedOp} ?`,
    params: [value as SQLQueryBindings],
  }
}

/**
 * Build an IN clause
 */
export function buildInClause(
  column: string,
  values: SQLQueryBindings[],
  negate = false
): { sql: string; params: SQLQueryBindings[] } {
  if (values.length === 0) {
    throw new Error("IN clause requires at least one value")
  }

  const quotedCol = quoteIdentifier(column)
  const placeholders = buildPlaceholders(values)
  const keyword = negate ? "NOT IN" : "IN"

  return {
    sql: `${quotedCol} ${keyword} (${placeholders})`,
    params: values,
  }
}

/**
 * Build a BETWEEN clause
 */
export function buildBetweenClause(
  column: string,
  min: SQLQueryBindings,
  max: SQLQueryBindings,
  negate = false
): { sql: string; params: SQLQueryBindings[] } {
  const quotedCol = quoteIdentifier(column)
  const keyword = negate ? "NOT BETWEEN" : "BETWEEN"

  return {
    sql: `${quotedCol} ${keyword} ? AND ?`,
    params: [min, max],
  }
}
