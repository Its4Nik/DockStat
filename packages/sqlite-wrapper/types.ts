import type { Database } from "bun:sqlite";

/**
 * Utility types for query building
 */
export type ColumnNames<T> = Array<keyof T> | ["*"];
export type WhereCondition<T> = Partial<
  Record<keyof T, string | number | boolean | null>
>;
export type RegexCondition<T> = Partial<Record<keyof T, string | RegExp>>;
export type OrderDirection = "ASC" | "DESC";

/**
 * Result types for mutation operations
 */
export interface InsertResult {
  /** The rowid of the last inserted row */
  insertId: number;
  /** Number of rows that were inserted */
  changes: number;
}

export interface UpdateResult {
  /** Number of rows that were updated */
  changes: number;
}

export interface DeleteResult {
  /** Number of rows that were deleted */
  changes: number;
}

/**
 * Options for INSERT operations
 */
export interface InsertOptions {
  /** Use INSERT OR IGNORE */
  orIgnore?: boolean;
  /** Use INSERT OR REPLACE */
  orReplace?: boolean;
  /** Use INSERT OR ABORT (default) */
  orAbort?: boolean;
  /** Use INSERT OR FAIL */
  orFail?: boolean;
  /** Use INSERT OR ROLLBACK */
  orRollback?: boolean;
}

/**
 * Base interface for all query builders
 */
export interface BaseQueryBuilder<T> {
  where(conditions: WhereCondition<T>): this;
  whereRgx(conditions: RegexCondition<T>): this;
  whereExpr(expr: string, params?: any[]): this;
  whereRaw(expr: string, params?: any[]): this;
  whereIn(column: keyof T, values: any[]): this;
  whereOp(column: keyof T, op: string, value: any): this;
}

/**
 * Configuration for JSON columns that should be automatically serialized/deserialized
 */
export interface JsonColumnConfig<T> {
  /** Columns that contain JSON data and should be auto-serialized/deserialized */
  jsonColumns?: Array<keyof T>;
}

/**
 * Internal state shared across query builders
 */
export interface QueryBuilderState<T> {
  db: Database;
  tableName: string;
  whereConditions: string[];
  whereParams: any[];
  regexConditions: Array<{ column: keyof T; regex: RegExp }>;
  jsonColumns?: Array<keyof T>;
}
