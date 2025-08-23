import type { Database, SQLQueryBindings } from 'bun:sqlite'
import type {
  ColumnNames,
  DatabaseRowData,
  JsonColumnConfig,
  OrderDirection,
  QueryBuilderState,
} from '../types'

/**
 * Base QueryBuilder class that manages core state and shared functionality.
 * This class provides the foundation for all query operations.
 */
export abstract class BaseQueryBuilder<T extends Record<string, unknown>> {
  protected state: QueryBuilderState<T>

  constructor(
    db: Database,
    tableName: string,
    jsonConfig?: JsonColumnConfig<T>
  ) {
    this.state = {
      db,
      tableName,
      whereConditions: [],
      whereParams: [],
      regexConditions: [],
      jsonColumns: jsonConfig?.jsonColumns,
    }
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
      return ['', []]
    }
    return [
      ` WHERE ${this.state.whereConditions.join(' AND ')}`,
      this.state.whereParams.slice(),
    ]
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
    if (
      this.state.whereConditions.length === 0 &&
      this.state.regexConditions.length === 0
    ) {
      throw new Error(
        `${operation} operation requires at least one WHERE condition. Use where(), whereRaw(), whereIn(), whereOp(), or whereRgx() to add conditions.`
      )
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
    if (!this.state.jsonColumns || !row) return row as T

    try {
      const transformed = { ...row } as DatabaseRowData
      for (const column of this.state.jsonColumns) {
        const columnKey = String(column)
        if (
          transformed[columnKey] !== null &&
          transformed[columnKey] !== undefined &&
          typeof transformed[columnKey] === 'string'
        ) {
          try {
            transformed[columnKey] = JSON.parse(
              transformed[columnKey] as string
            )
          } catch (parseError) {
            // Keep original value if JSON parsing fails
            console.warn(
              `JSON parse failed for column ${columnKey}:`,
              parseError
            )
          }
        }
      }
      return transformed as T
    } catch (error) {
      console.error('Error in transformRowFromDb:', error)
      return row as T
    }
  }

  /**
   * Transform multiple rows after fetching from database.
   */
  protected transformRowsFromDb(rows: unknown[]): T[] {
    if (!this.state.jsonColumns || !Array.isArray(rows)) return rows as T[]

    try {
      return rows.map((row, index) => {
        try {
          return this.transformRowFromDb(row)
        } catch (error) {
          console.error(`Error transforming row ${index}:`, error)
          return row as T
        }
      })
    } catch (error) {
      console.error('Error in transformRowsFromDb:', error)
      return rows as T[]
    }
  }

  /**
   * Transform row data before inserting/updating to database (serialize JSON columns).
   */
  protected transformRowToDb(row: Partial<T>): DatabaseRowData {
    if (!this.state.jsonColumns || !row) return row as DatabaseRowData

    const transformed: DatabaseRowData = { ...row } as DatabaseRowData
    for (const column of this.state.jsonColumns) {
      const columnKey = String(column)
      if (
        transformed[columnKey] !== undefined &&
        transformed[columnKey] !== null
      ) {
        if (typeof transformed[columnKey] === 'object') {
          transformed[columnKey] = JSON.stringify(transformed[columnKey])
        }
      }
    }
    return transformed
  }
}
