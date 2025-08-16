import type { Database } from "bun:sqlite";
import type {
  ColumnNames,
  OrderDirection,
  QueryBuilderState,
} from "../types";

/**
 * Base QueryBuilder class that manages core state and shared functionality.
 * This class provides the foundation for all query operations.
 */
export abstract class BaseQueryBuilder<T extends Record<string, any>> {
  protected state: QueryBuilderState<T>;

  constructor(db: Database, tableName: string) {
    this.state = {
      db,
      tableName,
      whereConditions: [],
      whereParams: [],
      regexConditions: [],
    };
  }

  /**
   * Get the database instance
   */
  protected getDb(): Database {
    return this.state.db;
  }

  /**
   * Get the table name
   */
  protected getTableName(): string {
    return this.state.tableName;
  }

  /**
   * Build the WHERE clause portion of a SQL query.
   * @returns Tuple of [whereClause, parameters] where whereClause includes "WHERE" prefix
   */
  protected buildWhereClause(): [string, any[]] {
    if (this.state.whereConditions.length === 0) {
      return ["", []];
    }
    return [
      ` WHERE ${this.state.whereConditions.join(" AND ")}`,
      this.state.whereParams.slice(),
    ];
  }

  /**
   * Check if there are any regex conditions that require client-side filtering.
   */
  protected hasRegexConditions(): boolean {
    return this.state.regexConditions.length > 0;
  }

  /**
   * Apply client-side regex filtering to a set of rows.
   * This is used when regex conditions are present.
   */
  protected applyRegexFiltering(rows: T[]): T[] {
    if (this.state.regexConditions.length === 0) {
      return rows;
    }

    return rows.filter((row) =>
      this.state.regexConditions.every(({ column, regex }) => {
        const value = row[String(column)];
        if (value === null || value === undefined) return false;
        return regex.test(String(value));
      }),
    );
  }

  /**
   * Validate that WHERE conditions exist for operations that require them.
   * Throws an error if no WHERE conditions are present.
   */
  protected requireWhereClause(operation: string): void {
    if (
      this.state.whereConditions.length === 0 &&
      this.state.regexConditions.length === 0
    ) {
      throw new Error(
        `${operation} operation requires at least one WHERE condition. Use where(), whereRaw(), whereIn(), whereOp(), or whereRgx() to add conditions.`,
      );
    }
  }

  /**
   * Quote SQL identifiers to prevent injection and handle special characters.
   */
  protected quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  /**
   * Reset all WHERE conditions and parameters.
   * Useful for reusing the same builder instance.
   */
  protected resetWhereConditions(): void {
    this.state.whereConditions = [];
    this.state.whereParams = [];
    this.state.regexConditions = [];
  }
}
