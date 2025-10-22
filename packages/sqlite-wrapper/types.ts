import type { Database, SQLQueryBindings } from "bun:sqlite";

/**
 * All SQLite data types including affinity types
 */
export const SQLiteTypes = {
  // Standard SQLite types
  INTEGER: "INTEGER" as const,
  TEXT: "TEXT" as const,
  REAL: "REAL" as const,
  BLOB: "BLOB" as const,
  NUMERIC: "NUMERIC" as const,

  // Common type aliases and variations
  INT: "INT" as const,
  TINYINT: "TINYINT" as const,
  SMALLINT: "SMALLINT" as const,
  MEDIUMINT: "MEDIUMINT" as const,
  BIGINT: "BIGINT" as const,

  // Text variations
  VARCHAR: "VARCHAR" as const,
  CHAR: "CHAR" as const,
  CHARACTER: "CHARACTER" as const,
  NCHAR: "NCHAR" as const,
  NVARCHAR: "NVARCHAR" as const,
  CLOB: "CLOB" as const,

  // Numeric variations
  DOUBLE: "DOUBLE" as const,
  FLOAT: "FLOAT" as const,
  DECIMAL: "DECIMAL" as const,

  // Date/Time (stored as TEXT, INTEGER, or REAL)
  DATE: "DATE" as const,
  DATETIME: "DATETIME" as const,
  TIMESTAMP: "TIMESTAMP" as const,
  TIME: "TIME" as const,

  // Boolean (stored as INTEGER)
  BOOLEAN: "BOOLEAN" as const,

  // JSON (stored as TEXT)
  JSON: "JSON" as const,
} as const;

export type SQLiteType = (typeof SQLiteTypes)[keyof typeof SQLiteTypes];

/**
 * SQLite built-in scalar functions
 */
export const SQLiteFunctions = {
  // Date/Time functions
  DATE: (expr: string) => `DATE(${expr})`,
  TIME: (expr: string) => `TIME(${expr})`,
  DATETIME: (expr: string) => `DATETIME(${expr})`,
  JULIANDAY: (expr: string) => `JULIANDAY(${expr})`,
  STRFTIME: (format: string, expr: string) => `STRFTIME('${format}', ${expr})`,

  // String functions
  LENGTH: (expr: string) => `LENGTH(${expr})`,
  LOWER: (expr: string) => `LOWER(${expr})`,
  UPPER: (expr: string) => `UPPER(${expr})`,
  TRIM: (expr: string, chars?: string) =>
    chars ? `TRIM(${expr}, '${chars}')` : `TRIM(${expr})`,
  LTRIM: (expr: string, chars?: string) =>
    chars ? `LTRIM(${expr}, '${chars}')` : `LTRIM(${expr})`,
  RTRIM: (expr: string, chars?: string) =>
    chars ? `RTRIM(${expr}, '${chars}')` : `RTRIM(${expr})`,
  SUBSTR: (expr: string, start: number, length?: number) =>
    length
      ? `SUBSTR(${expr}, ${start}, ${length})`
      : `SUBSTR(${expr}, ${start})`,
  SUBSTRING: (expr: string, start: number, length?: number) =>
    length
      ? `SUBSTRING(${expr}, ${start}, ${length})`
      : `SUBSTRING(${expr}, ${start})`,
  REPLACE: (expr: string, old: string, replacement: string) =>
    `REPLACE(${expr}, '${old}', '${replacement}')`,
  PRINTF: (format: string, ...args: string[]) =>
    `PRINTF('${format}', ${args.join(", ")})`,

  // Math functions
  ABS: (expr: string) => `ABS(${expr})`,
  ROUND: (expr: string, digits?: number) =>
    digits !== undefined ? `ROUND(${expr}, ${digits})` : `ROUND(${expr})`,
  RANDOM: () => "RANDOM()",
  MIN: (...exprs: string[]) => `MIN(${exprs.join(", ")})`,
  MAX: (...exprs: string[]) => `MAX(${exprs.join(", ")})`,

  // Type conversion
  CAST: (expr: string, type: string) => `CAST(${expr} AS ${type})`,
  TYPEOF: (expr: string) => `TYPEOF(${expr})`,

  // Conditional
  COALESCE: (...exprs: string[]) => `COALESCE(${exprs.join(", ")})`,
  IFNULL: (expr: string, replacement: string) =>
    `IFNULL(${expr}, ${replacement})`,
  NULLIF: (expr1: string, expr2: string) => `NULLIF(${expr1}, ${expr2})`,
  IIF: (condition: string, trueValue: string, falseValue: string) =>
    `IIF(${condition}, ${trueValue}, ${falseValue})`,

  // Aggregate functions (for use in expressions)
  COUNT: (expr?: string) => (expr ? `COUNT(${expr})` : "COUNT(*)"),
  SUM: (expr: string) => `SUM(${expr})`,
  AVG: (expr: string) => `AVG(${expr})`,
  TOTAL: (expr: string) => `TOTAL(${expr})`,
  GROUP_CONCAT: (expr: string, separator?: string) =>
    separator
      ? `GROUP_CONCAT(${expr}, '${separator}')`
      : `GROUP_CONCAT(${expr})`,

  // JSON functions (SQLite 3.45+)
  JSON: (expr: string) => `JSON(${expr})`,
  JSON_EXTRACT: (json: string, path: string) =>
    `JSON_EXTRACT(${json}, '${path}')`,
  JSON_TYPE: (json: string, path?: string) =>
    path ? `JSON_TYPE(${json}, '${path}')` : `JSON_TYPE(${json})`,
  JSON_VALID: (expr: string) => `JSON_VALID(${expr})`,
  JSON_ARRAY: (...values: string[]) => `JSON_ARRAY(${values.join(", ")})`,
  JSON_OBJECT: (...pairs: string[]) => `JSON_OBJECT(${pairs.join(", ")})`,
} as const;

/**
 * SQLite keywords and special values
 */
export const SQLiteKeywords = {
  // Special values
  NULL: "NULL" as const,
  CURRENT_TIME: "CURRENT_TIME" as const,
  CURRENT_DATE: "CURRENT_DATE" as const,
  CURRENT_TIMESTAMP: "CURRENT_TIMESTAMP" as const,

  // Boolean values (as integers)
  TRUE: "1" as const,
  FALSE: "0" as const,

  // Conflict resolution
  ROLLBACK: "ROLLBACK" as const,
  ABORT: "ABORT" as const,
  FAIL: "FAIL" as const,
  IGNORE: "IGNORE" as const,
  REPLACE: "REPLACE" as const,
} as const;

/**
 * Foreign key actions
 */
export type ForeignKeyAction =
  | "CASCADE"
  | "SET NULL"
  | "RESTRICT"
  | "NO ACTION"
  | "SET DEFAULT";

/**
 * Column constraint options with comprehensive support
 */
export interface ColumnConstraints {
  /** Column is PRIMARY KEY */
  primaryKey?: boolean;
  /** Column has AUTOINCREMENT (only valid with INTEGER PRIMARY KEY) */
  autoincrement?: boolean;
  /** Column is NOT NULL */
  notNull?: boolean;
  /** Column has UNIQUE constraint */
  unique?: boolean;
  /** Default value - can be literal value, function call, or keyword */
  default?: string | number | boolean | null | DefaultExpression;
  /** Custom check constraint */
  check?: string;
  /** Collation sequence */
  collate?: "BINARY" | "NOCASE" | "RTRIM" | string;
  /** References another table (foreign key) */
  references?: {
    table: string;
    column: string;
    onDelete?: ForeignKeyAction;
    onUpdate?: ForeignKeyAction;
  };
  /** Generated column expression (GENERATED ALWAYS AS) */
  generated?: {
    expression: string;
    stored?: boolean; // true for STORED, false/undefined for VIRTUAL
  };
  /** Column comment (stored as metadata, not in schema) */
  comment?: string;
}

/**
 * Type-safe default value expressions
 */
export type DefaultExpression = {
  _type: "expression";
  expression: string;
};

/**
 * Helper to create default expressions
 */
export const defaultExpr = (expression: string): DefaultExpression => ({
  _type: "expression",
  expression,
});

/**
 * Type-safe column definition
 */
export interface ColumnDefinition extends ColumnConstraints {
  /** SQLite data type */
  type: SQLiteType;
  /** Optional type parameters (e.g., VARCHAR(255)) */
  length?: number;
  /** Precision for DECIMAL/NUMERIC types */
  precision?: number;
  /** Scale for DECIMAL/NUMERIC types */
  scale?: number;
}

/**
 * Type-safe table schema definition
 */
export type TableSchema = Record<string, ColumnDefinition>;


export type TypedTableSchema<T extends string = string> = Record<T, ColumnDefinition>;

/**
 * Table constraint types
 */
export interface TableConstraints {
  /** PRIMARY KEY constraint on multiple columns */
  primaryKey?: string[];
  /** UNIQUE constraints */
  unique?: string[] | string[][];
  /** CHECK constraints */
  check?: string[];
  /** FOREIGN KEY constraints */
  foreignKeys?: Array<{
    columns: string[];
    references: {
      table: string;
      columns: string[];
      onDelete?: ForeignKeyAction;
      onUpdate?: ForeignKeyAction;
    };
  }>;
}

/**
 * Enhanced table options
 */
export interface TableOptions<T> {
  /** Add IF NOT EXISTS clause */
  ifNotExists?: boolean;
  /** Create WITHOUT ROWID table */
  withoutRowId?: boolean;
  /** Table constraints */
  constraints?: TableConstraints;
  /** Temporary table */
  temporary?: boolean;
  /** Table comment */
  comment?: string;

  jsonConfig?: JsonColumnConfig<T>
}

/**
 * Comprehensive column helper functions with full type support
 */
export const column = {
  /**
   * Create an INTEGER column with optional size specification
   */
  integer: (
    constraints?: ColumnConstraints & {
      size?: "TINYINT" | "SMALLINT" | "MEDIUMINT" | "BIGINT";
    },
  ): ColumnDefinition => ({
    type: constraints?.size || SQLiteTypes.INTEGER,
    ...constraints,
  }),

  /**
   * Create a TEXT column with optional length
   */
  text: (
    constraints?: ColumnConstraints & {
      length?: number;
      variant?: "VARCHAR" | "CHAR" | "CLOB" | "NCHAR" | "NVARCHAR";
    },
  ): ColumnDefinition => ({
    type: constraints?.variant || SQLiteTypes.TEXT,
    length: constraints?.length,
    ...constraints,
  }),

  /**
   * Create a REAL column
   */
  real: (
    constraints?: ColumnConstraints & { variant?: "DOUBLE" | "FLOAT" },
  ): ColumnDefinition => ({
    type: constraints?.variant || SQLiteTypes.REAL,
    ...constraints,
  }),

  /**
   * Create a BLOB column
   */
  blob: (constraints?: ColumnConstraints): ColumnDefinition => ({
    type: SQLiteTypes.BLOB,
    ...constraints,
  }),

  /**
   * Create a NUMERIC/DECIMAL column with precision and scale
   */
  numeric: (
    constraints?: ColumnConstraints & {
      precision?: number;
      scale?: number;
      variant?: "DECIMAL";
    },
  ): ColumnDefinition => ({
    type: constraints?.variant || SQLiteTypes.NUMERIC,
    precision: constraints?.precision,
    scale: constraints?.scale,
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
   * Create a TIMESTAMP column (stored as INTEGER by default)
   */
  timestamp: (
    constraints?: ColumnConstraints & { asText?: boolean },
  ): ColumnDefinition => ({
    type: constraints?.asText ? SQLiteTypes.TEXT : SQLiteTypes.INTEGER,
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
   * Create a BOOLEAN column (stored as INTEGER)
   */
  boolean: (constraints?: ColumnConstraints): ColumnDefinition => ({
    type: SQLiteTypes.BOOLEAN,
    check: constraints?.check || "{{COLUMN}} IN (0, 1)", // Placeholder for column name
    ...constraints,
  }),

  /**
   * Create a JSON column (stored as TEXT)
   */
  json: (
    constraints?: ColumnConstraints & { validateJson?: boolean },
  ): ColumnDefinition => ({
    type: SQLiteTypes.JSON,
    check: constraints?.validateJson
      ? "JSON_VALID({{COLUMN}})"
      : constraints?.check,
    ...constraints,
  }),

  /**
   * Create a VARCHAR column with specified length
   */
  varchar: (
    length: number,
    constraints?: ColumnConstraints,
  ): ColumnDefinition => ({
    type: SQLiteTypes.VARCHAR,
    length,
    ...constraints,
  }),

  /**
   * Create a CHAR column with specified length
   */
  char: (
    length: number,
    constraints?: ColumnConstraints,
  ): ColumnDefinition => ({
    type: SQLiteTypes.CHAR,
    length,
    ...constraints,
  }),

  /**
   * Create an auto-incrementing primary key column
   */
  id: (
    constraints?: Omit<
      ColumnConstraints,
      "primaryKey" | "autoincrement" | "notNull"
    >,
  ): ColumnDefinition => ({
    type: SQLiteTypes.INTEGER,
    primaryKey: true,
    autoincrement: true,
    notNull: true,
    ...constraints,
  }),

  /**
   * Create a UUID column (stored as TEXT)
   */
  uuid: (
    constraints?: ColumnConstraints & { generateDefault?: boolean },
  ): ColumnDefinition => ({
    type: SQLiteTypes.TEXT,
    length: 36,
    default: constraints?.generateDefault
      ? defaultExpr(
        "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))",
      )
      : constraints?.default,
    ...constraints,
  }),

  /**
   * Create a created_at timestamp column
   */
  createdAt: (
    constraints?: Omit<ColumnConstraints, "default" | "notNull"> & {
      asText?: boolean;
    },
  ): ColumnDefinition => ({
    type: constraints?.asText ? SQLiteTypes.DATETIME : SQLiteTypes.INTEGER,
    notNull: true,
    default: constraints?.asText
      ? defaultExpr("datetime('now')")
      : defaultExpr("strftime('%s', 'now')"),
    ...constraints,
  }),

  /**
   * Create an updated_at timestamp column
   */
  updatedAt: (
    constraints?: Omit<ColumnConstraints, "default"> & { asText?: boolean },
  ): ColumnDefinition => ({
    type: constraints?.asText ? SQLiteTypes.DATETIME : SQLiteTypes.INTEGER,
    default: constraints?.asText
      ? defaultExpr("datetime('now')")
      : defaultExpr("strftime('%s', 'now')"),
    ...constraints,
  }),

  /**
   * Create a foreign key reference column
   */
  foreignKey: (
    refTable: string,
    refColumn = "id",
    constraints?: ColumnConstraints & {
      onDelete?: ForeignKeyAction;
      onUpdate?: ForeignKeyAction;
      type?: SQLiteType;
    },
  ): ColumnDefinition => ({
    type: constraints?.type || SQLiteTypes.INTEGER,
    references: {
      table: refTable,
      column: refColumn,
      onDelete: constraints?.onDelete,
      onUpdate: constraints?.onUpdate,
    },
    ...constraints,
  }),

  /**
   * Create an enum column (with CHECK constraint)
   */
  enum: (
    values: string[],
    constraints?: ColumnConstraints,
  ): ColumnDefinition => ({
    type: SQLiteTypes.TEXT,
    notNull: true,
    check: `{{COLUMN}} IN (${values.map((v) => `'${v}'`).join(", ")})`,
    ...constraints,
  }),
};

/**
 * SQL function helpers for use in defaults and expressions
 */
export const sql = {
  // Current date/time
  now: () => defaultExpr("datetime('now')"),
  currentTime: () => defaultExpr("time('now')"),
  currentDate: () => defaultExpr("date('now')"),
  currentTimestamp: () => defaultExpr("datetime('now')"),
  unixTimestamp: () => defaultExpr("strftime('%s', 'now')"),

  // Functions
  ...SQLiteFunctions,

  // Raw expression
  raw: (expression: string) => defaultExpr(expression),

  // Literals
  null: () => null,
  true: () => 1,
  false: () => 0,
};

/**
 * Enhanced createTable method signature
 */
export type CreateTableColumns = string | Record<string, string> | TableSchema;

/**
 * Query builder state interface
 */
export interface QueryBuilderState<T extends Record<string, unknown>> {
  db: Database; // Database instance from bun:sqlite
  tableName: string;
  whereConditions: string[];
  whereParams: SQLQueryBindings[];
  regexConditions: Array<{
    column: keyof T;
    regex: RegExp;
  }>;
  jsonColumns?: Array<keyof T>;
}

/**
 * Column names type for SELECT operations
 */
export type ColumnNames<T> = ["*"] | Array<keyof T>;

/**
 * Order direction for ORDER BY clauses
 */
export type OrderDirection = "ASC" | "DESC";

/**
 * WHERE condition object type
 */
export type WhereCondition<T> = Partial<T>;

/**
 * Regex condition object type
 */
export type RegexCondition<T> = Partial<Record<keyof T, RegExp | string>>;

/**
 * Insert result interface
 */
export interface InsertResult {
  insertId: number;
  changes: number;
}

/**
 * Update result interface
 */
export interface UpdateResult {
  changes: number;
}

/**
 * Delete result interface
 */
export interface DeleteResult {
  changes: number;
}

/**
 * Insert options interface
 */
export interface InsertOptions {
  orIgnore?: boolean;
  orReplace?: boolean;
  orAbort?: boolean;
  orFail?: boolean;
  orRollback?: boolean;
}

/**
 * JSON column configuration
 */
export type JsonColumnConfig<T> = Array<keyof T>

/**
 * Generic database row type
 */
export type DatabaseRow = Record<string, unknown>;

/**
 * SQL parameter type
 */
export type SqlParameter = SQLQueryBindings;

/**
 * Database row with unknown structure
 */
export type DatabaseRowData = Record<string, SQLQueryBindings>;
