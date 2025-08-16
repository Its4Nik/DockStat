import type {
  WhereCondition,
  RegexCondition,
} from "../types";
import { BaseQueryBuilder } from "./base";

/**
 * Mixin class that adds WHERE-related functionality to the QueryBuilder.
 * This includes all conditional filtering methods.
 */
export class WhereQueryBuilder<T extends Record<string, any>> extends BaseQueryBuilder<T> {
  /**
   * Add simple equality conditions to the WHERE clause.
   * Handles null values appropriately with IS NULL / IS NOT NULL.
   *
   * @param conditions - Object with column-value pairs for equality checks
   * @returns this for method chaining
   */
  where(conditions: WhereCondition<T>): this {
    for (const [column, value] of Object.entries(conditions)) {
      if (value === null || value === undefined) {
        this.state.whereConditions.push(`${String(column)} IS NULL`);
      } else {
        this.state.whereConditions.push(`${String(column)} = ?`);
        this.state.whereParams.push(value);
      }
    }
    return this;
  }

  /**
   * Add regex conditions. Note: regex conditions are applied client-side
   * after SQL execution due to Bun's SQLite limitations.
   *
   * @param conditions - Object with column-regex pairs
   * @returns this for method chaining
   */
  whereRgx(conditions: RegexCondition<T>): this {
    for (const [column, value] of Object.entries(conditions)) {
      if (value instanceof RegExp) {
        this.state.regexConditions.push({
          column: column as keyof T,
          regex: value
        });
      } else if (typeof value === "string") {
        this.state.regexConditions.push({
          column: column as keyof T,
          regex: new RegExp(value),
        });
      } else if (value !== null && value !== undefined) {
        // Handle non-regex values as simple equality conditions
        this.state.whereConditions.push(`${String(column)} = ?`);
        this.state.whereParams.push(value);
      }
    }
    return this;
  }

  /**
   * Add a raw SQL WHERE fragment with parameter binding.
   *
   * @param expr - SQL fragment (without leading WHERE/AND), can use ? placeholders
   * @param params - Values for the placeholders in order
   * @returns this for method chaining
   */
  whereExpr(expr: string, params: any[] = []): this {
    if (!expr || typeof expr !== "string") {
      throw new Error("whereExpr: expr must be a non-empty string");
    }
    // Wrap in parentheses to preserve grouping when combined with other clauses
    this.state.whereConditions.push(`(${expr})`);
    if (params.length) {
      this.state.whereParams.push(...params);
    }
    return this;
  }

  /**
   * Alias for whereExpr for compatibility
   */
  whereRaw(expr: string, params: any[] = []): this {
    return this.whereExpr(expr, params);
  }

  /**
   * Add an IN clause for the given column with proper parameter binding.
   *
   * @param column - Column name to check
   * @param values - Non-empty array of values for the IN clause
   * @returns this for method chaining
   */
  whereIn(column: keyof T, values: any[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("whereIn: values must be a non-empty array");
    }
    const placeholders = values.map(() => "?").join(", ");
    this.state.whereConditions.push(`${String(column)} IN (${placeholders})`);
    this.state.whereParams.push(...values);
    return this;
  }

  /**
   * Add a NOT IN clause for the given column with proper parameter binding.
   *
   * @param column - Column name to check
   * @param values - Non-empty array of values for the NOT IN clause
   * @returns this for method chaining
   */
  whereNotIn(column: keyof T, values: any[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("whereNotIn: values must be a non-empty array");
    }
    const placeholders = values.map(() => "?").join(", ");
    this.state.whereConditions.push(`${String(column)} NOT IN (${placeholders})`);
    this.state.whereParams.push(...values);
    return this;
  }

  /**
   * Add a comparison operator condition with proper null handling.
   * Supports: =, !=, <>, <, <=, >, >=, LIKE, GLOB, IS
   *
   * @param column - Column name
   * @param op - Comparison operator
   * @param value - Value to compare (handles null appropriately)
   * @returns this for method chaining
   */
  whereOp(column: keyof T, op: string, value: any): this {
    const normalizedOp = (op ?? "").toUpperCase().trim();
    const allowed = [
      "=",
      "!=",
      "<>",
      "<",
      "<=",
      ">",
      ">=",
      "LIKE",
      "GLOB",
      "IS",
      "IS NOT",
    ];

    if (!allowed.includes(normalizedOp)) {
      throw new Error(`whereOp: operator "${op}" not supported`);
    }

    // Handle null special-casing for IS / IS NOT and equality operators
    if (
      (value === null || value === undefined) &&
      (normalizedOp === "=" || normalizedOp === "IS")
    ) {
      this.state.whereConditions.push(`${String(column)} IS NULL`);
      return this;
    }

    if (
      (value === null || value === undefined) &&
      (normalizedOp === "!=" || normalizedOp === "<>" || normalizedOp === "IS NOT")
    ) {
      this.state.whereConditions.push(`${String(column)} IS NOT NULL`);
      return this;
    }

    // Normal param-bound condition
    this.state.whereConditions.push(`${String(column)} ${normalizedOp} ?`);
    this.state.whereParams.push(value);
    return this;
  }

  /**
   * Add a BETWEEN condition for the given column.
   *
   * @param column - Column name
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns this for method chaining
   */
  whereBetween(column: keyof T, min: any, max: any): this {
    this.state.whereConditions.push(`${String(column)} BETWEEN ? AND ?`);
    this.state.whereParams.push(min, max);
    return this;
  }

  /**
   * Add a NOT BETWEEN condition for the given column.
   *
   * @param column - Column name
   * @param min - Minimum value (exclusive)
   * @param max - Maximum value (exclusive)
   * @returns this for method chaining
   */
  whereNotBetween(column: keyof T, min: any, max: any): this {
    this.state.whereConditions.push(`${String(column)} NOT BETWEEN ? AND ?`);
    this.state.whereParams.push(min, max);
    return this;
  }

  /**
   * Add an IS NULL condition for the given column.
   *
   * @param column - Column name
   * @returns this for method chaining
   */
  whereNull(column: keyof T): this {
    this.state.whereConditions.push(`${String(column)} IS NULL`);
    return this;
  }

  /**
   * Add an IS NOT NULL condition for the given column.
   *
   * @param column - Column name
   * @returns this for method chaining
   */
  whereNotNull(column: keyof T): this {
    this.state.whereConditions.push(`${String(column)} IS NOT NULL`);
    return this;
  }
}
