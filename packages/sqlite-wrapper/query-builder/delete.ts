import type { SQLQueryBindings } from "bun:sqlite";
import type { DeleteResult } from "../types";
import { SelectQueryBuilder } from "./select";

/**
 * Mixin class that adds DELETE functionality to the QueryBuilder.
 * Handles safe delete operations with mandatory WHERE conditions.
 */
export class DeleteQueryBuilder<
  T extends Record<string, unknown>,
> extends SelectQueryBuilder<T> {
  /**
   * Delete rows matching the WHERE conditions.
   * Requires at least one WHERE condition to prevent accidental full table deletion.
   *
   * @returns Delete result with changes count
   */
  delete(): DeleteResult {
    this.requireWhereClause("DELETE");

    // Handle regex conditions by first fetching matching rows
    if (this.hasRegexConditions()) {
      const result = this.deleteWithRegexConditions();
      this.reset();
      return result;
    }

    // Build DELETE statement
    const [whereClause, whereParams] = this.buildWhereClause();
    const query = `DELETE FROM ${this.quoteIdentifier(this.getTableName())}${whereClause}`;

    const result = this.getDb()
      .prepare(query)
      .run(...whereParams);

    this.reset();
    return {
      changes: result.changes,
    };
  }

  /**
   * Handle DELETE operations when regex conditions are present.
   * This requires client-side filtering and individual row deletion.
   */
  private deleteWithRegexConditions(): DeleteResult {
    this.reset();
    // First, get all rows matching SQL conditions (without regex)
    const [selectQuery, selectParams] = this.buildWhereClause();
    const candidateRows = this.getDb()
      .prepare(
        `SELECT rowid, * FROM ${this.quoteIdentifier(this.getTableName())}${selectQuery}`,
      )
      .all(...selectParams) as (T & { rowid: number })[];

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows);

    if (matchingRows.length === 0) {
      return { changes: 0 };
    }

    // Delete each matching row by rowid
    const deleteQuery = `DELETE FROM ${this.quoteIdentifier(this.getTableName())} WHERE rowid = ?`;
    const stmt = this.getDb().prepare(deleteQuery);

    let totalChanges = 0;
    for (const row of matchingRows) {
      const result = stmt.run(row.rowid as SQLQueryBindings);
      totalChanges += result.changes;
    }

    return { changes: totalChanges };
  }

  /**
   * Delete and get the deleted rows back.
   * This is useful when you want to see what was deleted for logging or audit purposes.
   *
   * @returns Array of deleted rows
   */
  deleteAndGet(): T[] {
    // First, get the rows that will be deleted
    const rowsToDelete = this.all();

    // Perform the delete
    const deleteResult = this.delete();

    if (deleteResult.changes === 0) {
      return [];
    }

    // Return the rows that were deleted
    const out = rowsToDelete;
    this.reset();
    return out;
  }

  /**
   * Soft delete - mark rows as deleted instead of physically removing them.
   * This requires a 'deleted_at' or similar column in your table schema.
   *
   * @param deletedColumn - Column name to mark as deleted (defaults to 'deleted_at')
   * @param deletedValue - Value to set for the deleted marker (defaults to current timestamp)
   * @returns Update result with changes count
   */
  softDelete(
    deletedColumn: keyof T = "deleted_at" as keyof T,
    deletedValue: SQLQueryBindings = Math.floor(Date.now() / 1000),
  ): DeleteResult {
    this.requireWhereClause("SOFT DELETE");

    // Handle regex conditions
    if (this.hasRegexConditions()) {
      const result = this.softDeleteWithRegexConditions(deletedColumn, deletedValue);
      this.reset();
      return result;
    }

    // Build UPDATE statement to mark as deleted
    const [whereClause, whereParams] = this.buildWhereClause();
    const query = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${this.quoteIdentifier(String(deletedColumn))} = ?${whereClause}`;

    const result = this.getDb()
      .prepare(query)
      .run(deletedValue, ...whereParams);

    this.reset();
    return {
      changes: result.changes,
    };
  }

  /**
   * Handle soft delete operations when regex conditions are present.
   */
  private softDeleteWithRegexConditions(
    deletedColumn: keyof T,
    deletedValue: SQLQueryBindings,
  ): DeleteResult {
    // First, get all rows matching SQL conditions (without regex)
    const [selectQuery, selectParams] = this.buildWhereClause();
    const candidateRows = this.getDb()
      .prepare(
        `SELECT rowid, * FROM ${this.quoteIdentifier(this.getTableName())}${selectQuery}`,
      )
      .all(...selectParams) as (T & { rowid: number })[];

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows);

    if (matchingRows.length === 0) {
      return { changes: 0 };
    }

    // Soft delete each matching row by rowid
    const updateQuery = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${this.quoteIdentifier(String(deletedColumn))} = ? WHERE rowid = ?`;
    const stmt = this.getDb().prepare(updateQuery);

    let totalChanges = 0;
    for (const row of matchingRows) {
      const result = stmt.run(deletedValue, row.rowid as SQLQueryBindings);
      totalChanges += result.changes;
    }

    return { changes: totalChanges };
  }

  /**
   * Restore soft deleted rows by clearing the deleted marker.
   *
   * @param deletedColumn - Column name that marks rows as deleted
   * @returns Update result with changes count
   */
  restore(deletedColumn: keyof T = "deleted_at" as keyof T): DeleteResult {
    this.requireWhereClause("RESTORE");

    // Handle regex conditions
    if (this.hasRegexConditions()) {
      const result = this.restoreWithRegexConditions(deletedColumn);
      this.reset();
      return result;
    }

    // Build UPDATE statement to clear the deleted marker
    const [whereClause, whereParams] = this.buildWhereClause();
    const query = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${this.quoteIdentifier(String(deletedColumn))} = NULL${whereClause}`;

    const result = this.getDb()
      .prepare(query)
      .run(...whereParams);

    this.reset();
    return {
      changes: result.changes,
    };
  }

  /**
   * Handle restore operations when regex conditions are present.
   */
  private restoreWithRegexConditions(deletedColumn: keyof T): DeleteResult {
    // First, get all rows matching SQL conditions (without regex)
    const [selectQuery, selectParams] = this.buildWhereClause();
    const candidateRows = this.getDb()
      .prepare(
        `SELECT rowid, * FROM ${this.quoteIdentifier(this.getTableName())}${selectQuery}`,
      )
      .all(...selectParams) as (T & { rowid: number })[];

    // Apply regex filtering
    const matchingRows = this.applyRegexFiltering(candidateRows);

    if (matchingRows.length === 0) {
      return { changes: 0 };
    }

    // Restore each matching row by rowid
    const updateQuery = `UPDATE ${this.quoteIdentifier(this.getTableName())} SET ${this.quoteIdentifier(String(deletedColumn))} = NULL WHERE rowid = ?`;
    const stmt = this.getDb().prepare(updateQuery);

    let totalChanges = 0;
    for (const row of matchingRows) {
      const result = stmt.run(row.rowid as SQLQueryBindings);
      totalChanges += result.changes;
    }

    return { changes: totalChanges };
  }

  /**
   * Batch delete multiple sets of rows based on different conditions.
   * This is more efficient than individual deletes when removing many different row sets.
   *
   * @param conditions - Array of WHERE condition objects
   * @returns Delete result with total changes count
   */
  deleteBatch(conditions: Array<Partial<T>>): DeleteResult {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      throw new Error("deleteBatch: conditions must be a non-empty array");
    }

    const db = this.getDb();

    // Use a transaction for batch operations
    const transaction = db.transaction(
      (conditionsToProcess: Array<Partial<T>>) => {
        let totalChanges = 0;

        for (const whereData of conditionsToProcess) {
          // Build WHERE conditions for this delete
          const whereConditions: string[] = [];
          const whereParams: SQLQueryBindings[] = [];

          for (const [column, value] of Object.entries(whereData)) {
            if (value === null || value === undefined) {
              whereConditions.push(`${this.quoteIdentifier(column)} IS NULL`);
            } else {
              whereConditions.push(`${this.quoteIdentifier(column)} = ?`);
              whereParams.push(value);
            }
          }

          if (whereConditions.length === 0) {
            throw new Error(
              "deleteBatch: each delete must have WHERE conditions",
            );
          }

          // Build DELETE statement
          const whereClause = ` WHERE ${whereConditions.join(" AND ")}`;
          const query = `DELETE FROM ${this.quoteIdentifier(this.getTableName())}${whereClause}`;

          const result = db.prepare(query).run(...whereParams);
          totalChanges += result.changes;
        }

        return { changes: totalChanges };
      },
    );

    const result = transaction(conditions);
    this.reset();
    return result;
  }

  /**
   * Truncate the entire table (delete all rows).
   * This bypasses the WHERE condition requirement since it's explicitly destructive.
   * USE WITH EXTREME CAUTION!
   *
   * @returns Delete result with changes count
   */
  truncate(): DeleteResult {
    const query = `DELETE FROM ${this.quoteIdentifier(this.getTableName())}`;
    const result = this.getDb().prepare(query).run();

    this.reset();
    return {
      changes: result.changes,
    };
  }

  /**
   * Delete rows older than a specified timestamp.
   * Convenience method for common cleanup operations.
   *
   * @param timestampColumn - Column name containing the timestamp
   * @param olderThan - Timestamp threshold (rows older than this will be deleted)
   * @returns Delete result with changes count
   */
  deleteOlderThan(timestampColumn: keyof T, olderThan: number): DeleteResult {
    const changes = this.whereOp(timestampColumn, "<", olderThan).delete();
    this.reset();
    return changes;
  }

  /**
   * Delete duplicate rows based on specified columns, keeping only the first occurrence.
   * This is useful for data cleanup operations.
   *
   * @param columns - Columns to check for duplicates
   * @returns Delete result with changes count
   */
  deleteDuplicates(columns: Array<keyof T>): DeleteResult {
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error("deleteDuplicates: columns must be a non-empty array");
    }

    const columnNames = columns.map((col) => String(col));
    const quotedColumns = columnNames
      .map((col) => this.quoteIdentifier(col))
      .join(", ");

    // Find duplicate rows, keeping the one with the minimum rowid
    const query = `
      DELETE FROM ${this.quoteIdentifier(this.getTableName())}
      WHERE rowid NOT IN (
        SELECT MIN(rowid)
        FROM ${this.quoteIdentifier(this.getTableName())}
        GROUP BY ${quotedColumns}
      )
    `;

    const result = this.getDb().prepare(query).run();

    this.reset();
    return {
      changes: result.changes,
    };
  }
}
