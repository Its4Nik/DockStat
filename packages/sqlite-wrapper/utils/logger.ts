import { Logger, type LogHook } from "@dockstat/logger"

/**
 * Centralized logging for sqlite-wrapper
 *
 * This module provides a clean, consistent logging interface
 * for all sqlite-wrapper operations.
 */

/**
 * Truncate a string to a maximum length with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

/**
 * Format query parameters for logging (truncated for readability)
 */
function formatParams(params?: unknown[]): string {
  if (!params || params.length === 0) return ""
  const str = JSON.stringify(params)
  return truncate(str, 60)
}

/**
 * SqliteLogger - A wrapper around @dockstat/logger with sqlite-specific helpers
 */
export class SqliteLogger {
  private logger: Logger
  private tableName?: string

  constructor(name: string, parent?: Logger, tableName?: string, logHook?: LogHook) {
    try {
      if (parent && typeof parent.spawn === "function") {
        this.logger = parent.spawn(name)
      } else {
        this.logger = new Logger(name, [], logHook)
      }
    } catch (error) {
      this.logger = new Logger(name, [], logHook)
      console.error(error)
    }

    this.tableName = tableName
  }

  /**
   * Create a child logger for a specific component
   */
  child(name: string): SqliteLogger {
    return new SqliteLogger(name, this.logger, this.tableName)
  }

  /**
   * Create a table-scoped logger
   */
  forTable(tableName: string): SqliteLogger {
    const child = new SqliteLogger(tableName, this.logger, tableName)
    return child
  }

  // ===== Standard log methods =====

  debug(message: string): void {
    this.logger.debug(message)
  }

  info(message: string): void {
    this.logger.info(message)
  }

  warn(message: string): void {
    this.logger.warn(message)
  }

  error(message: string): void {
    this.logger.error(message)
  }

  // ===== Sqlite-specific log helpers =====

  /**
   * Log a database connection event
   */
  connection(path: string, action: "open" | "close"): void {
    this.logger.info(`Database ${action}: ${path}`)
  }

  /**
   * Log a SQL query execution
   */
  query(operation: string, sql: string, params?: unknown[]): void {
    const paramStr = formatParams(params)
    const sqlStr = truncate(sql.replace(/\s+/g, " ").trim(), 100)
    const msg = paramStr
      ? `${operation} | ${sqlStr} | params=${paramStr}`
      : `${operation} | ${sqlStr}`
    this.logger.debug(msg)
  }

  /**
   * Log query results
   */
  result(operation: string, rowCount: number): void {
    this.logger.debug(`${operation} | rows=${rowCount}`)
  }

  /**
   * Log a table creation
   */
  tableCreate(tableName: string, columns: string[]): void {
    this.logger.debug(`CREATE TABLE ${tableName} | columns=[${columns.join(", ")}]`)
  }

  /**
   * Log backup operations
   */
  backup(action: "create" | "restore" | "list" | "delete", path?: string): void {
    const msg = path ? `Backup ${action}: ${path}` : `Backup ${action}`
    this.logger.info(msg)
  }

  /**
   * Log row transformation
   */
  transform(direction: "serialize" | "deserialize", columnTypes: string[]): void {
    if (columnTypes.length === 0) return
    this.logger.debug(`Transform ${direction}: [${columnTypes.join(", ")}]`)
  }

  /**
   * Log parser configuration
   */
  parserConfig(json: string[], boolean: string[], module: string[]): void {
    const parts: string[] = []
    if (json.length > 0) parts.push(`JSON=[${json.join(",")}]`)
    if (boolean.length > 0) parts.push(`BOOL=[${boolean.join(",")}]`)
    if (module.length > 0) parts.push(`MODULE=[${module.join(",")}]`)
    if (parts.length > 0) {
      this.logger.debug(`Parser config: ${parts.join(" ")}`)
    }
  }

  /**
   * Log transaction events
   */
  transaction(action: "begin" | "commit" | "rollback" | "savepoint", name?: string): void {
    const msg = name ? `Transaction ${action}: ${name}` : `Transaction ${action}`
    this.logger.debug(msg)
  }

  /**
   * Get the underlying @dockstat/logger instance
   */
  getBaseLogger(): Logger {
    return this.logger
  }

  /**
   * Add parent loggers for chaining
   */
  addParents(parents: string[]): void {
    this.logger.addParents(parents)
  }

  /**
   * Get parents for logger chaining
   */
  getParentsForLoggerChaining(): string[] {
    return this.logger.getParentsForLoggerChaining()
  }
}

// ===== Module exports =====

/**
 * Main logger instance for sqlite-wrapper
 */
export const logger = new SqliteLogger("Sqlite")

/**
 * Create a new logger for a specific module
 */
export function createLogger(name: string, baseLogger?: Logger): SqliteLogger {
  // If a base logger is provided (recommended for apps/packages that want shared LogHook/parents),
  // derive a sqlite-scoped child logger from it.
  if (baseLogger) return new SqliteLogger(name, baseLogger)

  // Fallback to the package-level logger (works, but won't automatically inherit app hooks)
  return logger.child(name)
}

export function addLoggerParents(parents: string[]): void {
  logger.addParents(parents)
}

/**
 * Configure a shared LogHook for sqlite-wrapper's root logger.
 *
 * Useful when consumers (e.g. `apps/api`, `packages/db`) want sqlite-wrapper logs
 * to be routed through the same sink/formatter as the rest of the app.
 */
export function setSqliteLogHook(logHook: LogHook): void {
  logger.getBaseLogger().setLogHook(logHook)
}

/**
 * Optional convenience for consumers: create a sqlite-scoped base Logger that shares a LogHook.
 *
 * This is handy if you want to pass a base logger into `createLogger()` / `DB` and have
 * everything inherit the same hook.
 */
export function createSqliteBaseLogger(logHook?: LogHook): Logger {
  return new Logger("Sqlite", [], logHook)
}

export default logger
