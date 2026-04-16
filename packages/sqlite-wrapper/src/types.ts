import type { Database, SQLQueryBindings } from "bun:sqlite"

/**
 * All SQLite data types including affinity types
 */
export const SQLiteTypes = {
  BIGINT: "BIGINT" as const,
  BLOB: "BLOB" as const,

  // Boolean (stored as INTEGER)
  BOOLEAN: "BOOLEAN" as const,
  CHAR: "CHAR" as const,
  CHARACTER: "CHARACTER" as const,
  CLOB: "CLOB" as const,

  // Date/Time (stored as TEXT, INTEGER, or REAL)
  DATE: "DATE" as const,
  DATETIME: "DATETIME" as const,
  DECIMAL: "DECIMAL" as const,

  // Numeric variations
  DOUBLE: "DOUBLE" as const,
  FLOAT: "FLOAT" as const,

  // Common type aliases and variations
  INT: "INT" as const,
  // Standard SQLite types
  INTEGER: "INTEGER" as const,

  // JSON (stored as TEXT)
  JSON: "JSON" as const,
  MEDIUMINT: "MEDIUMINT" as const,

  // Modules (stored as TEXT)
  MODULE: "TEXT" as const,
  NCHAR: "NCHAR" as const,
  NUMERIC: "NUMERIC" as const,
  NVARCHAR: "NVARCHAR" as const,
  REAL: "REAL" as const,
  SMALLINT: "SMALLINT" as const,
  TEXT: "TEXT" as const,
  TIME: "TIME" as const,
  TIMESTAMP: "TIMESTAMP" as const,
  TINYINT: "TINYINT" as const,

  // Text variations
  VARCHAR: "VARCHAR" as const,
} as const

export type SQLiteType = (typeof SQLiteTypes)[keyof typeof SQLiteTypes]

/**
 * SQLite built-in scalar functions
 */
export const SQLiteFunctions = {
  // Math functions
  ABS: (expr: string) => `ABS(${expr})`,
  AVG: (expr: string) => `AVG(${expr})`,

  // Type conversion
  CAST: (expr: string, type: string) => `CAST(${expr} AS ${type})`,

  // Conditional
  COALESCE: (...exprs: string[]) => `COALESCE(${exprs.join(", ")})`,

  // Aggregate functions (for use in expressions)
  COUNT: (expr?: string) => (expr ? `COUNT(${expr})` : "COUNT(*)"),
  // Date/Time functions
  DATE: (expr: string) => `DATE(${expr})`,
  DATETIME: (expr: string) => `DATETIME(${expr})`,
  GROUP_CONCAT: (expr: string, separator?: string) =>
    separator ? `GROUP_CONCAT(${expr}, '${separator}')` : `GROUP_CONCAT(${expr})`,
  IFNULL: (expr: string, replacement: string) => `IFNULL(${expr}, ${replacement})`,
  IIF: (condition: string, trueValue: string, falseValue: string) =>
    `IIF(${condition}, ${trueValue}, ${falseValue})`,

  // JSON functions (SQLite 3.45+)
  JSON: (expr: string) => `JSON(${expr})`,
  JSON_ARRAY: (...values: string[]) => `JSON_ARRAY(${values.join(", ")})`,
  JSON_EXTRACT: (json: string, path: string) => `JSON_EXTRACT(${json}, '${path}')`,
  JSON_OBJECT: (...pairs: string[]) => `JSON_OBJECT(${pairs.join(", ")})`,
  JSON_TYPE: (json: string, path?: string) =>
    path ? `JSON_TYPE(${json}, '${path}')` : `JSON_TYPE(${json})`,
  JSON_VALID: (expr: string) => `JSON_VALID(${expr})`,
  JULIANDAY: (expr: string) => `JULIANDAY(${expr})`,

  // String functions
  LENGTH: (expr: string) => `LENGTH(${expr})`,
  LOWER: (expr: string) => `LOWER(${expr})`,
  LTRIM: (expr: string, chars?: string) =>
    chars ? `LTRIM(${expr}, '${chars}')` : `LTRIM(${expr})`,
  MAX: (...exprs: string[]) => `MAX(${exprs.join(", ")})`,
  MIN: (...exprs: string[]) => `MIN(${exprs.join(", ")})`,
  NULLIF: (expr1: string, expr2: string) => `NULLIF(${expr1}, ${expr2})`,
  PRINTF: (format: string, ...args: string[]) => `PRINTF('${format}', ${args.join(", ")})`,
  RANDOM: () => "RANDOM()",
  REPLACE: (expr: string, old: string, replacement: string) =>
    `REPLACE(${expr}, '${old}', '${replacement}')`,
  ROUND: (expr: string, digits?: number) =>
    digits !== undefined ? `ROUND(${expr}, ${digits})` : `ROUND(${expr})`,
  RTRIM: (expr: string, chars?: string) =>
    chars ? `RTRIM(${expr}, '${chars}')` : `RTRIM(${expr})`,
  STRFTIME: (format: string, expr: string) => `STRFTIME('${format}', ${expr})`,
  SUBSTR: (expr: string, start: number, length?: number) =>
    length ? `SUBSTR(${expr}, ${start}, ${length})` : `SUBSTR(${expr}, ${start})`,
  SUBSTRING: (expr: string, start: number, length?: number) =>
    length ? `SUBSTRING(${expr}, ${start}, ${length})` : `SUBSTRING(${expr}, ${start})`,
  SUM: (expr: string) => `SUM(${expr})`,
  TIME: (expr: string) => `TIME(${expr})`,
  TOTAL: (expr: string) => `TOTAL(${expr})`,
  TRIM: (expr: string, chars?: string) => (chars ? `TRIM(${expr}, '${chars}')` : `TRIM(${expr})`),
  TYPEOF: (expr: string) => `TYPEOF(${expr})`,
  UPPER: (expr: string) => `UPPER(${expr})`,
} as const

/**
 * SQLite keywords and special values
 */
export const SQLiteKeywords = {
  ABORT: "ABORT" as const,
  CURRENT_DATE: "CURRENT_DATE" as const,
  CURRENT_TIME: "CURRENT_TIME" as const,
  CURRENT_TIMESTAMP: "CURRENT_TIMESTAMP" as const,
  FAIL: "FAIL" as const,
  FALSE: "0" as const,
  IGNORE: "IGNORE" as const,
  // Special values
  NULL: "NULL" as const,
  REPLACE: "REPLACE" as const,

  // Conflict resolution
  ROLLBACK: "ROLLBACK" as const,

  // Boolean values (as integers)
  TRUE: "1" as const,
} as const

/**
 * Foreign key actions
 */
export type ForeignKeyAction = "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION" | "SET DEFAULT"

/**
 * Column constraint options with comprehensive support
 */
export interface ColumnConstraints {
  /** Column is PRIMARY KEY */
  primaryKey?: boolean
  /** Column has AUTOINCREMENT (only valid with INTEGER PRIMARY KEY) */
  autoincrement?: boolean
  /** Column is NOT NULL */
  notNull?: boolean
  /** Column has UNIQUE constraint */
  unique?: boolean
  /** Default value - can be literal value, function call, or keyword */
  default?: string | number | boolean | null | DefaultExpression
  /** Custom check constraint */
  check?: string
  /** Collation sequence */
  collate?: "BINARY" | "NOCASE" | "RTRIM" | string
  /** References another table (foreign key) */
  references?: {
    table: string
    column: string
    onDelete?: ForeignKeyAction
    onUpdate?: ForeignKeyAction
  }
  /** Generated column expression (GENERATED ALWAYS AS) */
  generated?: {
    expression: string
    stored?: boolean // true for STORED, false/undefined for VIRTUAL
  }
  /** Column comment (stored as metadata, not in schema) */
  comment?: string
}

/**
 * Type-safe default value expressions
 */
export type DefaultExpression = {
  _type: "expression"
  expression: string
}

/**
 * Helper to create default expressions
 */
export const defaultExpr = (expression: string): DefaultExpression => ({
  _type: "expression",
  expression,
})

/**
 * Type-safe column definition
 */
export interface ColumnDefinition extends ColumnConstraints {
  /** SQLite data type */
  type: SQLiteType
  /** Optional type parameters (e.g., VARCHAR(255)) */
  length?: number
  /** Precision for DECIMAL/NUMERIC types */
  precision?: number
  /** Scale for DECIMAL/NUMERIC types */
  scale?: number
}

/**
 * Type-safe table schema definition
 */
export type TableSchema = Record<string, ColumnDefinition>

export type TypedTableSchema<T extends string = string> = Record<T, ColumnDefinition>

/**
 * Table constraint types
 */
export interface TableConstraints<T> {
  /** PRIMARY KEY constraint on multiple columns */
  primaryKey?: ArrayKey<T>
  /** UNIQUE constraints */
  unique?: string[] | string[][]
  /** CHECK constraints */
  check?: string[]
  /** FOREIGN KEY constraints */
  foreignKeys?: Array<{
    columns: ArrayKey<T>[]
    references: {
      table: string
      columns: string[]
      onDelete?: ForeignKeyAction
      onUpdate?: ForeignKeyAction
    }
  }>
}

/**
 * Enhanced table options
 */
export interface MigrationOptions {
  enabled?: boolean
  /** Whether to preserve data during migration (default: true) */
  preserveData?: boolean
  /** How to handle constraint violations during data copy */
  onConflict?: "fail" | "ignore" | "replace"
  /** Suffix for temporary table during migration (default: '_migration_temp') */
  tempTableSuffix?: string
}

export interface TableOptions<T> {
  /** Add IF NOT EXISTS clause */
  ifNotExists?: boolean
  /** Create WITHOUT ROWID table */
  withoutRowId?: boolean
  /** Table constraints */
  constraints?: TableConstraints<T>
  /** Temporary table */
  temporary?: boolean
  /** Table comment */
  comment?: string
  /** Enable automatic schema migration (default: true) */
  migrate?: MigrationOptions

  parser?: Partial<Parser<T>>
}

export interface Parser<T> extends ModuleParser<T> {
  JSON?: ArrayKey<T>
  BOOLEAN?: ArrayKey<T>
  DATE?: ArrayKey<T>
}

interface ModuleParser<T> {
  MODULE?: Partial<Record<keyof T, Bun.TranspilerOptions>>
}

/**
 * Comprehensive column helper functions with full type support
 */
export const column = {
  /**
   * Create a BLOB column
   */
  blob: (constraints?: ColumnConstraints): ColumnDefinition => ({
    type: SQLiteTypes.BLOB,
    ...constraints,
  }),

  /**
   * Create a BOOLEAN column (stored as INTEGER)
   */
  boolean: (constraints?: ColumnConstraints): ColumnDefinition => ({
    check: constraints?.check || "{{COLUMN}} IN (0, 1)", // Placeholder for column name
    type: SQLiteTypes.BOOLEAN,
    ...constraints,
  }),

  /**
   * Create a CHAR column with specified length
   */
  char: (length: number, constraints?: ColumnConstraints): ColumnDefinition => ({
    length,
    type: SQLiteTypes.CHAR,
    ...constraints,
  }),

  /**
   * Create a created_at timestamp column
   */
  createdAt: (
    constraints?: Omit<ColumnConstraints, "default" | "notNull"> & {
      asText?: boolean
    }
  ): ColumnDefinition => ({
    default: constraints?.asText
      ? defaultExpr("datetime('now')")
      : defaultExpr("strftime('%s', 'now')"),
    notNull: true,
    type: constraints?.asText ? SQLiteTypes.DATETIME : SQLiteTypes.INTEGER,
    ...constraints,
  }),

  /**
   * Create a DATE column (stored as TEXT)
   */
  date: (constraints?: ColumnConstraints): ColumnDefinition => ({
    type: SQLiteTypes.DATE,
    ...constraints,
  }),

  /**
   * Create a DATETIME column (stored as TEXT)
   */
  datetime: (constraints?: ColumnConstraints): ColumnDefinition => ({
    type: SQLiteTypes.DATETIME,
    ...constraints,
  }),

  /**
   * Create an enum column (with CHECK constraint)
   */
  enum: (values: string[], constraints?: ColumnConstraints): ColumnDefinition => ({
    check: `{{COLUMN}} IN (${values.map((v) => `'${v}'`).join(", ")})`,
    notNull: true,
    type: SQLiteTypes.TEXT,
    ...constraints,
  }),

  /**
   * Create a foreign key reference column
   */
  foreignKey: <_T extends Record<string, unknown>>(
    refTable: string,
    refColumn: keyof _T = "id",
    constraints?: ColumnConstraints & {
      onDelete?: ForeignKeyAction
      onUpdate?: ForeignKeyAction
      type?: SQLiteType
    }
  ): ColumnDefinition => ({
    references: {
      column: String(refColumn),
      onDelete: constraints?.onDelete,
      onUpdate: constraints?.onUpdate,
      table: refTable,
    },
    type: constraints?.type || SQLiteTypes.INTEGER,
    ...constraints,
  }),

  /**
   * Create an auto-incrementing primary key column
   */
  id: (
    constraints?: Omit<ColumnConstraints, "primaryKey" | "autoincrement" | "notNull">
  ): ColumnDefinition => ({
    autoincrement: true,
    notNull: true,
    primaryKey: true,
    type: SQLiteTypes.INTEGER,
    ...constraints,
  }),
  /**
   * Create an INTEGER column with optional size specification
   */
  integer: (
    constraints?: ColumnConstraints & {
      size?: "TINYINT" | "SMALLINT" | "MEDIUMINT" | "BIGINT"
    }
  ): ColumnDefinition => ({
    type: constraints?.size || SQLiteTypes.INTEGER,
    ...constraints,
  }),

  /**
   * Create a JSON column (stored as TEXT)
   */
  json: (constraints?: ColumnConstraints & { validateJson?: boolean }): ColumnDefinition => ({
    check: constraints?.validateJson ? "JSON_VALID({{COLUMN}})" : constraints?.check,
    type: SQLiteTypes.JSON,
    ...constraints,
  }),

  /**
   * Creates a function Column that will be parsed and transpiled using Bun.transpiler
   */
  module: (constraints?: ColumnConstraints): ColumnDefinition => ({
    comment:
      constraints?.comment ||
      "A simple Module column, with automatic serilisation and deserilisation using Bun.Transpiler()",
    type: SQLiteTypes.MODULE,
    ...constraints,
  }),

  /**
   * Create a NUMERIC/DECIMAL column with precision and scale
   */
  numeric: (
    constraints?: ColumnConstraints & {
      precision?: number
      scale?: number
      variant?: "DECIMAL"
    }
  ): ColumnDefinition => ({
    precision: constraints?.precision,
    scale: constraints?.scale,
    type: constraints?.variant || SQLiteTypes.NUMERIC,
    ...constraints,
  }),

  /**
   * Create a REAL column
   */
  real: (constraints?: ColumnConstraints & { variant?: "DOUBLE" | "FLOAT" }): ColumnDefinition => ({
    type: constraints?.variant || SQLiteTypes.REAL,
    ...constraints,
  }),

  /**
   * Create a TEXT column with optional length
   */
  text: (
    constraints?: ColumnConstraints & {
      length?: number
      variant?: "VARCHAR" | "CHAR" | "CLOB" | "NCHAR" | "NVARCHAR"
    }
  ): ColumnDefinition => ({
    length: constraints?.length,
    type: constraints?.variant || SQLiteTypes.TEXT,
    ...constraints,
  }),

  /**
   * Create a TIME column (stored as TEXT)
   */
  time: (constraints?: ColumnConstraints): ColumnDefinition => ({
    type: SQLiteTypes.TIME,
    ...constraints,
  }),

  /**
   * Create a TIMESTAMP column (stored as INTEGER by default)
   */
  timestamp: (constraints?: ColumnConstraints & { asText?: boolean }): ColumnDefinition => ({
    type: constraints?.asText ? SQLiteTypes.TEXT : SQLiteTypes.INTEGER,
    ...constraints,
  }),

  /**
   * Create an updated_at timestamp column
   */
  updatedAt: (
    constraints?: Omit<ColumnConstraints, "default"> & { asText?: boolean }
  ): ColumnDefinition => ({
    default: constraints?.asText
      ? defaultExpr("datetime('now')")
      : defaultExpr("strftime('%s', 'now')"),
    type: constraints?.asText ? SQLiteTypes.DATETIME : SQLiteTypes.INTEGER,
    ...constraints,
  }),

  /**
   * Create a UUID column (stored as TEXT)
   */
  uuid: (constraints?: ColumnConstraints & { generateDefault?: boolean }): ColumnDefinition => ({
    default: constraints?.generateDefault
      ? defaultExpr(
          "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))"
        )
      : constraints?.default,
    length: 36,
    type: SQLiteTypes.TEXT,
    ...constraints,
  }),

  /**
   * Create a VARCHAR column with specified length
   */
  varchar: (length: number, constraints?: ColumnConstraints): ColumnDefinition => ({
    length,
    type: SQLiteTypes.VARCHAR,
    ...constraints,
  }),
}

/**
 * SQL function helpers for use in defaults and expressions
 */
export const sql = {
  currentDate: () => defaultExpr("date('now')"),
  currentTime: () => defaultExpr("time('now')"),
  currentTimestamp: () => defaultExpr("datetime('now')"),
  // Current date/time
  now: () => defaultExpr("datetime('now')"),
  unixTimestamp: () => defaultExpr("strftime('%s', 'now')"),

  // Functions
  ...SQLiteFunctions,
  false: () => 0,

  // Literals
  null: () => null,

  // Raw expression
  raw: (expression: string) => defaultExpr(expression),
  true: () => 1,
}

/**
 * Enhanced createTable method signature
 */
export type CreateTableColumns = string | Record<string, string> | TableSchema

export type IndexOrder = "ASC" | "DESC"

export type IndexColumn =
  | string
  | {
      name: string
      order?: IndexOrder
    }

export type IndexMethod = "btree" | "hash" | "gist" | "spgist" | "gin" | "brin" | string

/**
 * Query builder state interface
 */
export interface QueryBuilderState<T extends Record<string, unknown>> {
  db: Database // Database instance from bun:sqlite
  tableName: string
  whereConditions: string[]
  whereParams: SQLQueryBindings[]
  regexConditions: Array<{
    column: string
    regex: RegExp
  }>
  joinClauses: JoinClause[]
  parser?: Parser<T>
}

/**
 * Column names type for SELECT operations
 */
export type ColumnNames<T> = ["*"] | Array<keyof T>

/**
 * Order direction for ORDER BY clauses
 */
export type OrderDirection = "ASC" | "DESC"

/**
 * WHERE condition object type
 */
export type WhereCondition<T> = Partial<T>

/**
 * Regex condition object type
 */
export type RegexCondition<T> = Partial<Record<keyof T, RegExp | string>>

/**
 * Join type for SQL JOIN clauses
 */
export type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS"

/**
 * Join condition - can be a column mapping or raw expression
 *
 * Column mapping example: { "local_column": "foreign_table.foreign_column" }
 * Raw expression example: "users.id = posts.user_id AND posts.published = 1"
 */
export type JoinCondition = Record<string, string> | string

/**
 * Join clause representing a single JOIN operation
 */
export interface JoinClause {
  type: JoinType
  table: string
  alias?: string
  condition: JoinCondition
}

/**
 * Insert result interface
 */
export interface InsertResult {
  insertId: number
  changes: number
  insertedIDs?: number[]
}

/**
 * Update result interface
 */
export interface UpdateResult {
  changes: number
}

/**
 * Delete result interface
 */
export interface DeleteResult {
  changes: number
}

/**
 * Insert options interface
 */
export interface InsertOptions {
  orIgnore?: boolean
  orReplace?: boolean
  orAbort?: boolean
  orFail?: boolean
  orRollback?: boolean
}

/**
 * JSON column configuration
 */
export type ArrayKey<T> = Array<keyof T>

/**
 * Generic database row type
 */
export type DatabaseRow = Record<string, unknown>

/**
 * SQL parameter type
 */
export type SqlParameter = SQLQueryBindings

/**
 * Database row with unknown structure
 */
export type DatabaseRowData = Record<string, SQLQueryBindings>

export interface TableColumn {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | number | null
  pk: number
}

export interface IndexInfo {
  name: string
  sql: string | null
  unique: boolean
  origin: string
  partial: number
}

export interface ForeignKeyInfo {
  id: number
  seq: number
  table: string
  from: string
  to: string
  on_update: string
  on_delete: string
  match: string
}

export interface ForeignKeyStatus {
  foreign_keys: number
}
