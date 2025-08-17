import { Database } from "bun:sqlite";
import { QueryBuilder } from "./query-builder/index";
import type { JsonColumnConfig } from "./types";

/**
 * Re-export QueryBuilder and types so callers can import them directly:
 *
 * import DB, { QueryBuilder, InsertResult, UpdateResult, DeleteResult } from "./db";
 */
export { QueryBuilder };
export type {
  InsertResult,
  UpdateResult,
  DeleteResult,
  InsertOptions,
  ColumnNames,
  WhereCondition,
  RegexCondition,
  JsonColumnConfig,
} from "./types";

/**
 * TypedSQLite — tiny wrapper around bun:sqlite `Database`.
 *
 * This class centralizes common helpers like `table()` (returns a typed QueryBuilder)
 * and `createTable()` for creating tables easily.
 */
class DB {
  private db: Database;

  /**
   * Open or create a SQLite database at `path`.
   *
   * @param path - Path to the SQLite file (e.g. "app.db"). Use ":memory:" for in-memory DB.
   * @param options - Optional database configuration
   */
  constructor(
    path: string,
    options?: {
      pragmas?: Array<[string, any]>;
      loadExtensions?: string[];
    },
  ) {
    this.db = new Database(path);

    // Apply PRAGMA settings if provided
    if (options?.pragmas) {
      for (const [name, value] of options.pragmas) {
        this.pragma(name, value);
      }
    }

    // Load extensions if provided
    if (options?.loadExtensions) {
      for (const extensionPath of options.loadExtensions) {
        this.loadExtension(extensionPath);
      }
    }
  }

  /**
   * Get a typed QueryBuilder for a given table name.
   *
   * Example:
   * ```ts
   * interface User { id: number; name: string; email: string; }
   *
   * // SELECT operations
   * const users = db.table<User>("users")
   *   .select(["id", "name"])
   *   .where({ active: true })
   *   .orderBy("created_at")
   *   .desc()
   *   .limit(10)
   *   .all();
   *
   * // INSERT operations
   * const insertResult = db.table<User>("users")
   *   .insert({ name: "John", email: "john@example.com" });
   *
   * // UPDATE operations
   * const updateResult = db.table<User>("users")
   *   .where({ id: 1 })
   *   .update({ name: "Jane" });
   *
   * // DELETE operations
   * const deleteResult = db.table<User>("users")
   *   .where({ active: false })
   *   .delete();
   * ```
   *
   * For tables with JSON columns, you can specify which columns should be auto-serialized/deserialized:
   * ```ts
   * interface Config { id: number; settings: object; metadata: any[]; }
   *
   * const config = db.table<Config>("config", { jsonColumns: ["settings", "metadata"] })
   *   .select(["*"])
   *   .get(); // settings and metadata will be automatically parsed from JSON
   * ```
   *
   * `QueryBuilder` supports the following notable methods:
   *
   * **SELECT methods:**
   * - `select(columns: Array<keyof T> | ["*"])` — specify columns to select
   * - `where(conditions: Partial<Record<keyof T, string | number | boolean | null>>)` — simple equality/IS NULL checks
   * - `whereRgx(conditions: Partial<Record<keyof T, string | RegExp>>)` — regex conditions (applied client-side)
   * - `whereExpr(expr: string, params?: any[])` / `whereRaw(...)` — raw SQL fragments with parameter binding
   * - `whereIn(column: keyof T, values: any[])` — IN clause with parameter binding
   * - `whereOp(column: keyof T, op: string, value: any)` — comparison operators (=, !=, <, >, <=, >=, LIKE, GLOB, IS)
   * - `orderBy(column: keyof T)`, `asc()`, `desc()` — ordering
   * - `limit(n)`, `offset(n)` — pagination
   * - `all(): T[]`, `get(): T | null`, `first(): T | null`, `count(): number` — result execution
   *
   * **INSERT methods:**
   * - `insert(data: Partial<T> | Partial<T>[], options?: InsertOptions): InsertResult` — insert single/multiple rows
   * - `insertOrIgnore(data: Partial<T> | Partial<T>[]): InsertResult` — INSERT OR IGNORE
   * - `insertOrReplace(data: Partial<T> | Partial<T>[]): InsertResult` — INSERT OR REPLACE
   *
   * **UPDATE methods:**
   * - `update(data: Partial<T>): UpdateResult` — update rows (requires WHERE conditions)
   *
   * **DELETE methods:**
   * - `delete(): DeleteResult` — delete rows (requires WHERE conditions)
   *
   * Notes:
   * - Regex conditions in `whereRgx` are applied client-side after SQL execution
   * - When regex conditions are present, ordering/limit/offset are also applied client-side
   * - UPDATE and DELETE operations require at least one WHERE condition for safety
   * - All mutations return result objects with `changes` count and `insertId` (for INSERT)
   * - JSON columns are automatically serialized on INSERT/UPDATE and deserialized on SELECT
   *
   * @typeParam T - Row type for the table.
   * @param tableName - The table name to operate on.
   * @param jsonConfig - Optional configuration for JSON columns that should be auto-serialized/deserialized.
   * @returns QueryBuilder<T>
   */
  table<T extends Record<string, any>>(
    tableName: string,
    jsonConfig?: JsonColumnConfig<T>,
  ): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, tableName, jsonConfig);
  }

  /**
   * Close the underlying SQLite database handle.
   *
   * After calling `close()` the instance should not be used.
   */
  close(): void {
    this.db.close();
  }

  /**
   * Create a table.
   *
   * Accepts either:
   * - `columns` as a single SQL column-definition string:
   *     "id INTEGER PRIMARY KEY, name TEXT NOT NULL"
   * - `columns` as object `{ colName: "SQL TYPE CONSTRAINTS", ... }`
   *
   * Options:
   * - `ifNotExists`: prepend `IF NOT EXISTS`
   * - `withoutRowId`: append `WITHOUT ROWID`
   *
   * The method will safely quote identifiers (double quotes).
   *
   * @param tableName - Table name to create.
   * @param columns - Column definitions (SQL string) or a map of column→definition.
   * @param options - Optional flags `{ ifNotExists?: boolean; withoutRowId?: boolean }`.
   *
   * @throws {Error} If column definitions are empty or invalid.
   */
  createTable(
    tableName: string,
    columns: string | Record<string, string>,
    options?: { ifNotExists?: boolean; withoutRowId?: boolean },
  ): void {
    const ifNot = options?.ifNotExists ? "IF NOT EXISTS " : "";
    const withoutRowId = options?.withoutRowId ? " WITHOUT ROWID" : "";

    const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`;

    let columnDefs: string;
    if (typeof columns === "string") {
      columnDefs = columns.trim();
      if (!columnDefs) {
        throw new Error("Empty column definition string");
      }
    } else {
      const parts: string[] = [];
      for (const [col, def] of Object.entries(columns)) {
        if (!col) {
          continue;
        }
        const defTrim = (def ?? "").trim();
        if (!defTrim) {
          throw new Error(`Missing SQL type/constraints for column "${col}"`);
        }
        parts.push(`${quoteIdent(col)} ${defTrim}`);
      }
      if (parts.length === 0) {
        throw new Error("No columns provided");
      }
      columnDefs = parts.join(", ");
    }

    const sql = `CREATE TABLE ${ifNot}${quoteIdent(tableName)} (${columnDefs})${withoutRowId};`;
    this.db.exec(sql);
  }

  /**
   * Set or get a PRAGMA value.
   *
   * @param name - PRAGMA name (e.g., "foreign_keys", "journal_mode")
   * @param value - Value to set (omit to get current value)
   * @returns Current value when getting, undefined when setting
   */
  pragma(name: string, value?: any): any {
    if (value !== undefined) {
      this.db.exec(`PRAGMA ${name} = ${value}`);
    } else {
      const result = this.db.prepare(`PRAGMA ${name}`).get() as Record<
        string,
        any
      >;
      return Object.values(result)[0];
    }
  }

  /**
   * Load a SQLite extension.
   *
   * @param path - Absolute path to the compiled SQLite extension
   */
  loadExtension(path: string): void {
    this.db.loadExtension(path);
  }

  /**
   * Get direct access to the underlying SQLite database instance.
   * Use this for advanced operations not covered by the QueryBuilder.
   *
   * @returns The underlying Database instance
   */
  getDb(): Database {
    return this.db;
  }
}

export { DB };
