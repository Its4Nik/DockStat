import type { Database, SQLQueryBindings } from "bun:sqlite";
import type {
  ColumnNames,
  WhereCondition,
  RegexCondition,
  InsertResult,
  UpdateResult,
  DeleteResult,
  InsertOptions,
  QueryBuilderState,
  Parser,
} from "../types";
import { SelectQueryBuilder } from "./select";
import { InsertQueryBuilder } from "./insert";
import { UpdateQueryBuilder } from "./update";
import { DeleteQueryBuilder } from "./delete";

/**
 * Main QueryBuilder class that combines all functionality using composition.
 * This class provides a unified interface for SELECT, INSERT, UPDATE, and DELETE operations.
 *
 * Each operation type is implemented in a separate module for better maintainability:
 * - SELECT: column selection, ordering, limiting, result execution
 * - INSERT: single/bulk inserts with conflict resolution
 * - UPDATE: safe updates with mandatory WHERE conditions
 * - DELETE: safe deletes with mandatory WHERE conditions
 * - WHERE: shared conditional logic across all operations
 */
export class QueryBuilder<T extends Record<string, unknown>> {
  private selectBuilder: SelectQueryBuilder<T>;
  private insertBuilder: InsertQueryBuilder<T>;
  private updateBuilder: UpdateQueryBuilder<T>;
  private deleteBuilder: DeleteQueryBuilder<T>;

  constructor(
    db: Database,
    tableName: string,
    parser: Parser<T>
  ) {
    // Create instances of each specialized builder
    this.selectBuilder = new SelectQueryBuilder<T>(db, tableName, parser);
    this.insertBuilder = new InsertQueryBuilder<T>(db, tableName, parser);
    this.updateBuilder = new UpdateQueryBuilder<T>(db, tableName, parser);
    this.deleteBuilder = new DeleteQueryBuilder<T>(db, tableName, parser);

    // Ensure all builders share the same state for WHERE conditions
    this.syncBuilderStates();
  }

  /**
   * Synchronize the state between all builders so WHERE conditions are shared.
   */
  private syncBuilderStates(): void {
    const masterState = (
      this.selectBuilder as unknown as { state: QueryBuilderState<T> }
    ).state;
    (this.insertBuilder as unknown as { state: QueryBuilderState<T> }).state =
      masterState;
    (this.updateBuilder as unknown as { state: QueryBuilderState<T> }).state =
      masterState;
    (this.deleteBuilder as unknown as { state: QueryBuilderState<T> }).state =
      masterState;
  }

  // ===== WHERE METHODS (delegated to selectBuilder) =====

  /**
   * Add simple equality conditions to the WHERE clause.
   */
  where(conditions: WhereCondition<T>): this {
    this.selectBuilder.where(conditions);
    return this;
  }

  /**
   * Add regex conditions (applied client-side).
   */
  whereRgx(conditions: RegexCondition<T>): this {
    this.selectBuilder.whereRgx(conditions);
    return this;
  }

  /**
   * Add a raw SQL WHERE fragment with parameter binding.
   */
  whereExpr(expr: string, params: SQLQueryBindings[] = []): this {
    this.selectBuilder.whereExpr(expr, params);
    return this;
  }

  /**
   * Alias for whereExpr.
   */
  whereRaw(expr: string, params: SQLQueryBindings[] = []): this {
    this.selectBuilder.whereRaw(expr, params);
    return this;
  }

  /**
   * Add an IN clause with proper parameter binding.
   */
  whereIn(column: keyof T, values: SQLQueryBindings[]): this {
    this.selectBuilder.whereIn(column, values);
    return this;
  }

  /**
   * Add a NOT IN clause with proper parameter binding.
   */
  whereNotIn(column: keyof T, values: SQLQueryBindings[]): this {
    this.selectBuilder.whereNotIn(column, values);
    return this;
  }

  /**
   * Add a comparison operator condition.
   */
  whereOp(column: keyof T, op: string, value: SQLQueryBindings): this {
    this.selectBuilder.whereOp(column, op, value);
    return this;
  }

  /**
   * Add a BETWEEN condition.
   */
  whereBetween(
    column: keyof T,
    min: SQLQueryBindings,
    max: SQLQueryBindings,
  ): this {
    this.selectBuilder.whereBetween(column, min, max);
    return this;
  }

  /**
   * Add a NOT BETWEEN condition.
   */
  whereNotBetween(
    column: keyof T,
    min: SQLQueryBindings,
    max: SQLQueryBindings,
  ): this {
    this.selectBuilder.whereNotBetween(column, min, max);
    return this;
  }

  /**
   * Add an IS NULL condition.
   */
  whereNull(column: keyof T): this {
    this.selectBuilder.whereNull(column);
    return this;
  }

  /**
   * Add an IS NOT NULL condition.
   */
  whereNotNull(column: keyof T): this {
    this.selectBuilder.whereNotNull(column);
    return this;
  }

  // ===== SELECT METHODS (delegated to selectBuilder) =====

  /**
   * Specify which columns to select.
   */
  select(columns: ColumnNames<T>): this {
    this.selectBuilder.select(columns);
    return this;
  }

  /**
   * Add ORDER BY clause.
   */
  orderBy(column: keyof T): this {
    this.selectBuilder.orderBy(column);
    return this;
  }

  /**
   * Set order direction to descending.
   */
  desc(): this {
    this.selectBuilder.desc();
    return this;
  }

  /**
   * Set order direction to ascending.
   */
  asc(): this {
    this.selectBuilder.asc();
    return this;
  }

  /**
   * Add LIMIT clause.
   */
  limit(amount: number): this {
    this.selectBuilder.limit(amount);
    return this;
  }

  /**
   * Add OFFSET clause.
   */
  offset(start: number): this {
    this.selectBuilder.offset(start);
    return this;
  }

  // ===== SELECT EXECUTION METHODS (delegated to selectBuilder) =====

  /**
   * Execute the query and return all matching rows.
   */
  all(): T[] {
    return this.selectBuilder.all();
  }

  /**
   * Execute the query and return the first matching row, or null.
   */
  get(): T | null {
    return this.selectBuilder.get();
  }

  /**
   * Execute the query and return the first matching row, or null.
   */
  first(): T | null {
    return this.selectBuilder.first();
  }

  /**
   * Execute a COUNT query and return the number of matching rows.
   */
  count(): number {
    return this.selectBuilder.count();
  }

  /**
   * Check if any rows match the current conditions.
   */
  exists(): boolean {
    return this.selectBuilder.exists();
  }

  /**
   * Execute the query and return a single column value from the first row.
   */
  value<K extends keyof T>(column: K): T[K] | null {
    return this.selectBuilder.value(column);
  }

  /**
   * Execute the query and return an array of values from a single column.
   */
  pluck<K extends keyof T>(column: K): T[K][] {
    return this.selectBuilder.pluck(column);
  }

  // ===== INSERT METHODS (delegated to insertBuilder) =====

  /**
   * Insert a single row or multiple rows into the table.
   */
  insert(
    data: Partial<T> | Partial<T>[],
    options?: InsertOptions,
  ): InsertResult {
    return this.insertBuilder.insert(data, options);
  }

  /**
   * Insert with OR IGNORE conflict resolution.
   */
  insertOrIgnore(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insertBuilder.insertOrIgnore(data);
  }

  /**
   * Insert with OR REPLACE conflict resolution.
   */
  insertOrReplace(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insertBuilder.insertOrReplace(data);
  }

  /**
   * Insert with OR ABORT conflict resolution.
   */
  insertOrAbort(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insertBuilder.insertOrAbort(data);
  }

  /**
   * Insert with OR FAIL conflict resolution.
   */
  insertOrFail(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insertBuilder.insertOrFail(data);
  }

  /**
   * Insert with OR ROLLBACK conflict resolution.
   */
  insertOrRollback(data: Partial<T> | Partial<T>[]): InsertResult {
    return this.insertBuilder.insertOrRollback(data);
  }

  /**
   * Insert and get the inserted row back.
   */
  insertAndGet(data: Partial<T>, options?: InsertOptions): T | null {
    return this.insertBuilder.insertAndGet(data, options);
  }

  /**
   * Batch insert with transaction support.
   */
  insertBatch(rows: Partial<T>[], options?: InsertOptions): InsertResult {
    return this.insertBuilder.insertBatch(rows, options);
  }

  // ===== UPDATE METHODS (delegated to updateBuilder) =====

  /**
   * Update rows matching the WHERE conditions.
   */
  update(data: Partial<T>): UpdateResult {
    return this.updateBuilder.update(data);
  }

  /**
   * Update or insert (upsert) using INSERT OR REPLACE.
   */
  upsert(data: Partial<T>): UpdateResult {
    return this.updateBuilder.upsert(data);
  }

  /**
   * Increment a numeric column by a specified amount.
   */
  increment(column: keyof T, amount = 1): UpdateResult {
    return this.updateBuilder.increment(column, amount);
  }

  /**
   * Decrement a numeric column by a specified amount.
   */
  decrement(column: keyof T, amount = 1): UpdateResult {
    return this.updateBuilder.decrement(column, amount);
  }

  /**
   * Update and get the updated rows back.
   */
  updateAndGet(data: Partial<T>): T[] {
    return this.updateBuilder.updateAndGet(data);
  }

  /**
   * Batch update multiple rows with different values.
   */
  updateBatch(
    updates: Array<{ where: Partial<T>; data: Partial<T> }>,
  ): UpdateResult {
    return this.updateBuilder.updateBatch(updates);
  }

  // ===== DELETE METHODS (delegated to deleteBuilder) =====

  /**
   * Delete rows matching the WHERE conditions.
   */
  delete(): DeleteResult {
    return this.deleteBuilder.delete();
  }

  /**
   * Delete and get the deleted rows back.
   */
  deleteAndGet(): T[] {
    return this.deleteBuilder.deleteAndGet();
  }

  /**
   * Soft delete - mark rows as deleted instead of physically removing them.
   */
  softDelete(
    deletedColumn: keyof T = "deleted_at" as keyof T,
    deletedValue: SQLQueryBindings = Math.floor(Date.now() / 1000),
  ): DeleteResult {
    return this.deleteBuilder.softDelete(deletedColumn, deletedValue);
  }

  /**
   * Restore soft deleted rows.
   */
  restore(deletedColumn: keyof T = "deleted_at" as keyof T): DeleteResult {
    return this.deleteBuilder.restore(deletedColumn);
  }

  /**
   * Batch delete multiple sets of rows.
   */
  deleteBatch(conditions: Array<Partial<T>>): DeleteResult {
    return this.deleteBuilder.deleteBatch(conditions);
  }

  /**
   * Truncate the entire table (delete all rows).
   */
  truncate(): DeleteResult {
    return this.deleteBuilder.truncate();
  }

  /**
   * Delete rows older than a specified timestamp.
   */
  deleteOlderThan(timestampColumn: keyof T, olderThan: number): DeleteResult {
    return this.deleteBuilder.deleteOlderThan(timestampColumn, olderThan);
  }

  /**
   * Delete duplicate rows based on specified columns.
   */
  deleteDuplicates(columns: Array<keyof T>): DeleteResult {
    return this.deleteBuilder.deleteDuplicates(columns);
  }
}
