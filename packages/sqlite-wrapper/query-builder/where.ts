import type { SQLQueryBindings } from "bun:sqlite";
import type { WhereCondition, RegexCondition } from "../types";
import { BaseQueryBuilder } from "./base";

/**
 * Mixin class that adds WHERE-related functionality to the QueryBuilder.
 * This includes all conditional filtering methods.
 */
export class WhereQueryBuilder<
  T extends Record<string, unknown>,
> extends BaseQueryBuilder<T> {
  /**
   * Remove existing condition for a column
   * @param column - Column name to check
   * @param operation - Optional operation type (e.g., '=', 'IN', 'BETWEEN')
   */
  private removeExistingCondition(column: string, operation?: string): void {
    let existingIndex = -1;

    if (operation) {
      // Look for specific operation
      existingIndex = this.state.whereConditions.findIndex(condition =>
        condition.startsWith(`${String(column)} ${operation}`)
      );
    } else {
      // Look for any condition on this column
      existingIndex = this.state.whereConditions.findIndex(condition =>
        condition.startsWith(`${String(column)} `)
      );
    }

    if (existingIndex !== -1) {
      this.state.whereConditions.splice(existingIndex, 1);
      // Only remove params if they exist (some conditions might not have params)
      if (existingIndex < this.state.whereParams.length) {
        this.state.whereParams.splice(existingIndex, 1);
      }
    }

    // Also remove any regex conditions for this column
    this.state.regexConditions = this.state.regexConditions.filter(
      cond => String(cond.column) !== column
    );
  }

  /**
   * Add simple equality conditions to the WHERE clause.
   * Handles null values appropriately with IS NULL / IS NOT NULL.
   * Prevents duplicate conditions for the same column.
   *
   * @param conditions - Object with column-value pairs for equality checks
   * @returns this for method chaining
   */
  where(conditions: WhereCondition<T>): this {
    for (const [column, value] of Object.entries(conditions)) {
      // Remove any existing conditions for this column
      this.removeExistingCondition(column);

      if (value === null || value === undefined) {
        this.state.whereConditions.push(`${String(column)} IS NULL`);
      } else {
        this.state.whereConditions.push(`${String(column)} = ?`);

        // Convert JavaScript boolean to SQLite integer (0/1)
        let sqliteValue: SQLQueryBindings = value;
        if (typeof value === 'boolean') {
          sqliteValue = value ? 1 : 0;
          this.getLogger("WHERE").debug(`Converting boolean value ${value} to ${sqliteValue} for column ${column}`);
        }

        this.state.whereParams.push(sqliteValue);
      }
    }
    return this;
  }

  /**
   * Add regex conditions. Note: regex conditions are applied client-side
   * after SQL execution due to Bun's SQLite limitations.
   * Prevents duplicate regex conditions for the same column.
   *
   * @param conditions - Object with column-regex pairs
   * @returns this for method chaining
   */
  whereRgx(conditions: RegexCondition<T>): this {
    for (const [column, value] of Object.entries(conditions)) {
      // Remove any existing conditions for this column
      this.removeExistingCondition(column);

      if (value instanceof RegExp) {
        this.state.regexConditions.push({
          column: column as keyof T,
          regex: value,
        });
      } else if (typeof value === "string") {
        this.state.regexConditions.push({
          column: column as keyof T,
          regex: new RegExp(value),
        });
      } else if (value !== null && value !== undefined) {
        this.state.whereConditions.push(`${String(column)} = ?`);
        this.state.whereParams.push(value);
      }
    }
    return this;
  }

  /**
   * Add a raw SQL WHERE fragment with parameter binding.
   * Note: Raw expressions bypass duplicate checking as they may be complex conditions.
   *
   * @param expr - SQL fragment (without leading WHERE/AND), can use ? placeholders
   * @param params - Values for the placeholders in order
   * @returns this for method chaining
   */
  whereExpr(expr: string, params: SQLQueryBindings[] = []): this {
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
  whereRaw(expr: string, params: SQLQueryBindings[] = []): this {
    return this.whereExpr(expr, params);
  }

  /**
   * Add an IN clause for the given column with proper parameter binding.
   * Replaces any existing conditions for the same column.
   *
   * @param column - Column name to check
   * @param values - Non-empty array of values for the IN clause
   * @returns this for method chaining
   */
  whereIn(column: keyof T, values: SQLQueryBindings[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("whereIn: values must be a non-empty array");
    }

    // Remove any existing conditions for this column
    this.removeExistingCondition(String(column), "IN");

    const placeholders = values.map(() => "?").join(", ");
    this.state.whereConditions.push(`${String(column)} IN (${placeholders})`);
    this.state.whereParams.push(...values);
    return this;
  }

  /**
   * Add a NOT IN clause for the given column with proper parameter binding.
   * Replaces any existing conditions for the same column.
   *
   * @param column - Column name to check
   * @param values - Non-empty array of values for the NOT IN clause
   * @returns this for method chaining
   */
  whereNotIn(column: keyof T, values: SQLQueryBindings[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("whereNotIn: values must be a non-empty array");
    }

    // Remove any existing conditions for this column
    this.removeExistingCondition(String(column), "NOT IN");

    const placeholders = values.map(() => "?").join(", ");
    this.state.whereConditions.push(`${String(column)} NOT IN (${placeholders})`);
    this.state.whereParams.push(...values);
    return this;
  }

  /**
   * Add a comparison operator condition with proper null handling.
   * Replaces any existing conditions for the same column.
   * Supports: =, !=, <>, <, <=, >, >=, LIKE, GLOB, IS
   *
   * @param column - Column name
   * @param op - Comparison operator
   * @param value - Value to compare (handles null appropriately)
   * @returns this for method chaining
   */
  whereOp(column: keyof T, op: string, value: SQLQueryBindings): this {
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
      (normalizedOp === "!=" ||
        normalizedOp === "<>" ||
        normalizedOp === "IS NOT")
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
   * Replaces any existing conditions for the same column.
   *
   * @param column - Column name
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns this for method chaining
   */
  whereBetween(
    column: keyof T,
    min: SQLQueryBindings,
    max: SQLQueryBindings,
  ): this {
    // Remove any existing conditions for this column
    this.removeExistingCondition(String(column), "BETWEEN");

    this.state.whereConditions.push(`${String(column)} BETWEEN ? AND ?`);
    this.state.whereParams.push(min, max);
    return this;
  }

  /**
   * Add a NOT BETWEEN condition for the given column.
   * Replaces any existing conditions for the same column.
   *
   * @param column - Column name
   * @param min - Minimum value (exclusive)
   * @param max - Maximum value (exclusive)
   * @returns this for method chaining
   */
  whereNotBetween(
    column: keyof T,
    min: SQLQueryBindings,
    max: SQLQueryBindings,
  ): this {
    // Remove any existing conditions for this column
    this.removeExistingCondition(String(column), "NOT BETWEEN");

    this.state.whereConditions.push(`${String(column)} NOT BETWEEN ? AND ?`);
    this.state.whereParams.push(min, max);
    return this;
  }

  /**
   * Add an IS NULL condition for the given column.
   * Replaces any existing conditions for the same column.
   *
   * @param column - Column name
   * @returns this for method chaining
   */
  whereNull(column: keyof T): this {
    // Remove any existing conditions for this column
    this.removeExistingCondition(String(column));

    this.state.whereConditions.push(`${String(column)} IS NULL`);
    return this;
  }

  /**
   * Add an IS NOT NULL condition for the given column.
   * Replaces any existing conditions for the same column.
   *
   * @param column - Column name
   * @returns this for method chaining
   */
  whereNotNull(column: keyof T): this {
    // Remove any existing conditions for this column
    this.removeExistingCondition(String(column));

    this.state.whereConditions.push(`${String(column)} IS NOT NULL`);
    return this;
  }
}
