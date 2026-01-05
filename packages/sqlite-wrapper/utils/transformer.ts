import type { SQLQueryBindings } from "bun:sqlite"
import type { Parser } from "../types"
<<<<<<< HEAD
import { createLogger, type SqliteLogger } from "./logger"
=======
import { createLogger } from "./logger"
>>>>>>> main

/**
 * Row Transformer for sqlite-wrapper
 *
 * Handles serialization (to DB) and deserialization (from DB) of row data,
 * including JSON columns, Boolean columns, and Module columns.
 */

<<<<<<< HEAD
const defaultLogger = createLogger("Transformer")
=======
const logger = createLogger("transformer")
>>>>>>> main

/**
 * Generic row data type
 */
export type RowData = Record<string, SQLQueryBindings>

/**
 * Transform options
 */
export interface TransformOptions<T> {
  parser?: Parser<T>
<<<<<<< HEAD
  logger?: SqliteLogger
=======
>>>>>>> main
}

/**
 * Transform a row FROM the database (deserialization)
 *
 * - JSON columns: Parse JSON strings back to objects
 * - BOOLEAN columns: Convert 0/1 to true/false
 * - MODULE columns: Transpile and create importable URLs
 */
export function transformFromDb<T extends Record<string, unknown>>(
  row: unknown,
  options?: TransformOptions<T>
): T {
  if (!row || typeof row !== "object") {
    return row as T
  }

  const parser = options?.parser
  if (!parser) {
    return row as T
  }

<<<<<<< HEAD
  const logger = options?.logger || defaultLogger
=======
>>>>>>> main
  const transformed = { ...row } as RowData
  const transformedColumns: string[] = []

  // Transform JSON columns
  if (parser.JSON && parser.JSON.length > 0) {
    for (const column of parser.JSON) {
      const columnKey = String(column)
      const value = transformed[columnKey]

      if (value !== null && value !== undefined && typeof value === "string") {
        try {
          transformed[columnKey] = JSON.parse(value)
          transformedColumns.push(`JSON:${columnKey}`)
        } catch {
          // Keep original value if JSON parsing fails
          logger.warn(`Failed to parse JSON column: ${columnKey}`)
        }
      }
    }
  }

  // Transform BOOLEAN columns
  if (parser.BOOLEAN && parser.BOOLEAN.length > 0) {
    for (const column of parser.BOOLEAN) {
      const columnKey = String(column)
      const value = transformed[columnKey]

      if (value === null || value === undefined) {
        continue
      }

      // Already a boolean - no transformation needed
      if (typeof value === "boolean") {
        continue
      }

      // Convert number (0/1) to boolean
      if (typeof value === "number") {
        transformed[columnKey] = value === 1
        transformedColumns.push(`BOOL:${columnKey}`)
        continue
      }

      // Convert string representations
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase()
        if (["1", "true", "t", "yes"].includes(normalized)) {
          transformed[columnKey] = true
          transformedColumns.push(`BOOL:${columnKey}`)
        } else if (["0", "false", "f", "no"].includes(normalized)) {
          transformed[columnKey] = false
          transformedColumns.push(`BOOL:${columnKey}`)
        } else {
          // Try numeric conversion
          const num = Number(normalized)
          if (!Number.isNaN(num)) {
            transformed[columnKey] = num === 1
            transformedColumns.push(`BOOL:${columnKey}`)
          }
        }
      }
    }
  }

  // Transform MODULE columns
  if (parser.MODULE && Object.keys(parser.MODULE).length > 0) {
    for (const [funcKey, options] of Object.entries(parser.MODULE)) {
      const value = transformed[funcKey]

      if (value !== undefined && value !== null && typeof value === "string") {
        try {
          const transpiler = new Bun.Transpiler(options)
          const compiled = transpiler.transformSync(value)
          const blob = new Blob([compiled], { type: "text/javascript" })
          transformed[funcKey] = URL.createObjectURL(blob)
          transformedColumns.push(`MODULE:${funcKey}`)
        } catch (_error) {
          logger.warn(`Failed to transpile MODULE column: ${funcKey}`)
        }
      }
    }
  }

  if (transformedColumns.length > 0) {
    logger.transform("deserialize", transformedColumns)
  }

  return transformed as T
}

/**
 * Transform multiple rows FROM the database
 */
export function transformRowsFromDb<T extends Record<string, unknown>>(
  rows: unknown[],
  options?: TransformOptions<T>
): T[] {
  if (!rows || !Array.isArray(rows)) {
    return []
  }

  return rows.map((row) => transformFromDb<T>(row, options))
}

/**
 * Transform a row TO the database (serialization)
 *
 * - JSON columns: Stringify objects to JSON strings
 * - MODULE columns: Stringify functions
 */
export function transformToDb<T extends Record<string, unknown>>(
  row: Partial<T>,
  options?: TransformOptions<T>
): RowData {
  if (!row || typeof row !== "object") {
    return row as RowData
  }

  const parser = options?.parser
  if (!parser) {
    return row as RowData
  }

<<<<<<< HEAD
  const logger = options?.logger || defaultLogger
=======
>>>>>>> main
  const transformed = { ...row } as RowData
  const transformedColumns: string[] = []

  // Serialize JSON columns
  if (parser.JSON && parser.JSON.length > 0) {
    for (const column of parser.JSON) {
      const columnKey = String(column)
      const value = transformed[columnKey]

      if (value !== undefined && value !== null && typeof value === "object") {
        transformed[columnKey] = JSON.stringify(value)
        transformedColumns.push(`JSON:${columnKey}`)
      }
    }
  }

  // Serialize MODULE columns (functions to strings)
  if (parser.MODULE && Object.keys(parser.MODULE).length > 0) {
    for (const [funcKey, options] of Object.entries(parser.MODULE)) {
      const value = transformed[funcKey]

      if (value !== undefined && value !== null && typeof value === "function") {
        try {
          const transpiler = new Bun.Transpiler(options)
          const fnValue = value as () => unknown
          transformed[funcKey] = transpiler.transformSync(fnValue.toString())
          transformedColumns.push(`MODULE:${funcKey}`)
        } catch {
          logger.warn(`Failed to serialize MODULE column: ${funcKey}`)
        }
      }
    }
  }

  if (transformedColumns.length > 0) {
    logger.transform("serialize", transformedColumns)
  }

  return transformed
}

/**
 * Transform multiple rows TO the database
 */
export function transformRowsToDb<T extends Record<string, unknown>>(
  rows: Partial<T>[],
  options?: TransformOptions<T>
): RowData[] {
  if (!rows || !Array.isArray(rows)) {
    return []
  }

  return rows.map((row) => transformToDb<T>(row, options))
}

/**
 * Check if a parser has any transformations configured
 */
export function hasTransformations<T>(parser?: Parser<T>): boolean {
  if (!parser) return false

  const hasJson = !!(parser.JSON && parser.JSON.length > 0)
  const hasBoolean = !!(parser.BOOLEAN && parser.BOOLEAN.length > 0)
  const hasModule = !!(parser.MODULE && Object.keys(parser.MODULE).length > 0)

  return hasJson || hasBoolean || hasModule
}

/**
 * Get a summary of parser configuration
 */
export function getParserSummary<T>(parser?: Parser<T>): string {
  if (!parser) return "none"

  const parts: string[] = []

  if (parser.JSON && parser.JSON.length > 0) {
    parts.push(`JSON(${parser.JSON.length})`)
  }
  if (parser.BOOLEAN && parser.BOOLEAN.length > 0) {
    parts.push(`BOOL(${parser.BOOLEAN.length})`)
  }
  if (parser.MODULE && Object.keys(parser.MODULE).length > 0) {
    parts.push(`MODULE(${Object.keys(parser.MODULE).length})`)
  }

  return parts.length > 0 ? parts.join(", ") : "none"
}
