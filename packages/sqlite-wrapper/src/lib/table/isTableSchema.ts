import type { TableSchema } from "../../types"

/**
 * Type guard to determine if the provided columns object
 * is a TableSchema (typed ColumnDefinition objects).
 */
export function isTableSchema(columns: unknown): columns is TableSchema {
  if (typeof columns !== "object" || columns === null) {
    return false
  }

  // Check if any value has a 'type' property with a valid SQLite type
  for (const [_key, value] of Object.entries(columns as Record<string, unknown>)) {
    if (typeof value === "object" && value !== null && "type" in value) {
      const type = (value as { type: string }).type
      const validTypes = [
        "INTEGER",
        "TEXT",
        "REAL",
        "BLOB",
        "NUMERIC",
        "INT",
        "TINYINT",
        "SMALLINT",
        "MEDIUMINT",
        "BIGINT",
        "VARCHAR",
        "CHAR",
        "CHARACTER",
        "NCHAR",
        "NVARCHAR",
        "CLOB",
        "DOUBLE",
        "FLOAT",
        "DECIMAL",
        "DATE",
        "DATETIME",
        "TIMESTAMP",
        "TIME",
        "BOOLEAN",
        "JSON",
      ]
      if (validTypes.includes(type)) {
        return true
      }
    }
  }

  return false
}
