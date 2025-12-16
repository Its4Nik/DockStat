import type { Database, SQLQueryBindings } from "bun:sqlite"
import Logger from "@dockstat/logger"
import { logger } from ".."
import type { DatabaseRowData, Parser, QueryBuilderState } from "../types"

/**
 * Base QueryBuilder class that manages core state and shared functionality.
 * This class provides the foundation for all query operations.
 */
export abstract class BaseQueryBuilder<T extends Record<string, unknown>> {
  protected logger = new Logger("QueryBuilder", logger.getParentsForLoggerChaining())
  protected deleteLogger = new Logger("Delete", this.logger.getParentsForLoggerChaining())
  protected insertLogger = new Logger("Insert", this.logger.getParentsForLoggerChaining())
  protected selectLogger = new Logger("Select", this.logger.getParentsForLoggerChaining())
  protected updateLogger = new Logger("Update", this.logger.getParentsForLoggerChaining())
  protected whereLogger = new Logger("Where", this.logger.getParentsForLoggerChaining())
  protected state: QueryBuilderState<T>

  /**
   * Get the logger instance
   */
  protected getLogger(type: "DELETE" | "INSERT" | "SELECT" | "UPDATE" | "WHERE") {
    switch (type) {
      case "DELETE":
        return this.deleteLogger
      case "INSERT":
        return this.insertLogger
      case "SELECT":
        return this.selectLogger
      case "UPDATE":
        return this.updateLogger
      case "WHERE":
        return this.whereLogger
    }
  }

  constructor(db: Database, tableName: string, parser?: Parser<T>) {
    this.state = {
      db,
      tableName,
      whereConditions: [],
      whereParams: [],
      regexConditions: [],
      parser: parser,
    }
  }

  /**
   * Reset query builder state
   */
  protected reset(): void {
    this.state.whereConditions = []
    this.state.whereParams = []
    this.state.regexConditions = []
    // Reset any ordering, limit, offset, selected columns if present
    if ("orderColumn" in this) this.orderColumn = undefined
    if ("orderDirection" in this) this.orderDirection = "ASC"
    if ("limitValue" in this) this.limitValue = undefined
    if ("offsetValue" in this) this.offsetValue = undefined
    if ("selectedColumns" in this) this.selectedColumns = ["*"]
  }

  /**
   * Get the database instance
   */
  protected getDb(): Database {
    return this.state.db
  }

  /**
   * Get the table name
   */
  protected getTableName(): string {
    return this.state.tableName
  }

  /**
   * Build the WHERE clause portion of a SQL query.
   * @returns Tuple of [whereClause, parameters] where whereClause includes "WHERE" prefix
   */
  protected buildWhereClause(): [string, SQLQueryBindings[]] {
    if (this.state.whereConditions.length === 0) {
      return ["", []]
    }
    return [` WHERE ${this.state.whereConditions.join(" AND ")}`, this.state.whereParams.slice()]
  }

  /**
   * Check if there are any regex conditions that require client-side filtering.
   */
  protected hasRegexConditions(): boolean {
    return this.state.regexConditions.length > 0
  }

  /**
   * Apply client-side regex filtering to a set of rows.
   * This is used when regex conditions are present.
   */
  protected applyRegexFiltering(rows: T[]): T[] {
    if (this.state.regexConditions.length === 0) {
      return rows
    }

    return rows.filter((row) =>
      this.state.regexConditions.every(({ column, regex }) => {
        const value = row[String(column)]
        if (value === null || value === undefined) return false
        return regex.test(String(value))
      })
    )
  }

  /**
   * Validate that WHERE conditions exist for operations that require them.
   * Throws an error if no WHERE conditions are present.
   */
  protected requireWhereClause(operation: string): void {
    if (this.state.whereConditions.length === 0 && this.state.regexConditions.length === 0) {
      const error = `${operation} operation requires at least one WHERE condition. Use where(), whereRaw(), whereIn(), whereOp(), or whereRgx() to add conditions.`
      this.logger.error(error)
      throw new Error(error)
    }
  }

  /**
   * Quote SQL identifiers to prevent injection and handle special characters.
   */
  protected quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
  }

  /**
   * Reset all WHERE conditions and parameters.
   * Useful for reusing the same builder instance.
   */
  protected resetWhereConditions(): void {
    this.state.whereConditions = []
    this.state.whereParams = []
    this.state.regexConditions = []
  }

  /**
   * Transform row data after fetching from database (deserialize JSON columns).
   */
  protected transformRowFromDb(row: unknown): T {
    this.logger.debug(`Transforming row: ${JSON.stringify(row)}`)
    if (!row) {
      this.logger.warn("Empty row received")
      return row as T
    }

    try {
      const transformed = { ...row } as DatabaseRowData

      if (this.state.parser?.JSON) {
        for (const column of this.state.parser.JSON) {
          const columnKey = String(column)
          if (
            transformed[columnKey] !== null &&
            transformed[columnKey] !== undefined &&
            typeof transformed[columnKey] === "string"
          ) {
            try {
              transformed[columnKey] = JSON.parse(transformed[columnKey] as string)
            } catch (parseError) {
              // Keep original value if JSON parsing fails
              this.logger.warn(`JSON parse failed for column ${columnKey}: ${parseError}`)
            }
          }
        }
      }

      if (this.state.parser?.MODULE) {
        for (const [func, options] of Object.entries(this.state.parser.MODULE)) {
          const transpiler = new Bun.Transpiler(options)
          const funcKey = String(func)

          if (transformed[funcKey] !== undefined && transformed[funcKey] !== null) {
            const compiled = transpiler.transformSync(String(transformed[funcKey]))
            this.logger.debug(`Compiled function ${compiled}`)
            const blob = new Blob([compiled], { type: "text/javascript" })
            transformed[funcKey] = URL.createObjectURL(blob)
            this.logger.debug(`Created Object URL for importing: ${transformed[funcKey]}`)
          }
        }
      }

      if (this.state.parser?.BOOLEAN) {
        for (const column of this.state.parser.BOOLEAN) {
          const columnKey = String(column)
          if (
            (transformed[columnKey] !== null &&
              transformed[columnKey] !== undefined &&
              typeof transformed[columnKey] === "string") ||
            typeof transformed[columnKey] === "number"
          ) {
            transformed[columnKey] = ["true", "True", 1, true].includes(transformed[columnKey])
          }
        }
      }

      return transformed as T
    } catch (error) {
      this.logger.error(`Error in transformRowFromDb: ${error}`)
      return row as T
    }
  }

  /**
   * Transform multiple rows after fetching from database.
   */
  protected transformRowsFromDb(rows: unknown[]): T[] {
    if (!rows) {
      this.logger.warn("Empty row received")
      return rows as T[]
    }

    try {
      return rows.map((row, index) => {
        try {
          return this.transformRowFromDb(row)
        } catch (error) {
          this.logger.error(`Error transforming row ${index}: ${error}`)
          return row as T
        }
      })
    } catch (error) {
      this.logger.error(`Error in transformRowsFromDb: ${error}`)
      return rows as T[]
    }
  }

  /**
   * Transform row data before inserting/updating to database (serialize JSON columns).
   */
  protected transformRowToDb(row: Partial<T>): DatabaseRowData {
    this.logger.debug(
      `Transforming row (${JSON.stringify(row)}) to row Data = JSON=${!!this.state.parser?.JSON} MODULE=${!!this.state.parser?.MODULE}`
    )

    if (!row) {
      this.logger.debug("No row data received!")
      return row as DatabaseRowData
    }

    const transformed: DatabaseRowData = { ...row } as DatabaseRowData

    if (this.state.parser?.JSON) {
      for (const jsonCol of this.state.parser.JSON) {
        const columnKey = String(jsonCol)
        this.logger.debug(`Checking: ${columnKey}`)
        if (transformed[columnKey] !== undefined && transformed[columnKey] !== null) {
          if (typeof transformed[columnKey] === "object") {
            transformed[columnKey] = JSON.stringify(transformed[columnKey])
          }
        }
      }
    }

    if (this.state.parser?.MODULE) {
      for (const [func, options] of Object.entries(this.state.parser.MODULE)) {
        this.logger.debug(`Transpiling ${JSON.stringify(options)}`)
        const transpiler = new Bun.Transpiler(options)
        const funcKey = String(func)

        if (transformed[funcKey] !== undefined && transformed[funcKey] !== null) {
          if (typeof transformed[funcKey] === "function") {
            transformed[funcKey] = transpiler.transformSync(
              (transformed[funcKey] as () => unknown).toString()
            )
          }
        }
      }
    }

    return transformed
  }
}
