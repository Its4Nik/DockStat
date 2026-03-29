/**
 * Logger utility for @dockstat/docker-swarm
 */

/**
 * Log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error"

/**
 * Log context
 */
export interface LogContext {
  module?: string
  operation?: string
  [key: string]: unknown
}

/**
 * Simple logger interface
 */
export interface Logger {
  debug?(message: string, context?: LogContext): void
  info?(message: string, context?: LogContext): void
  warn?(message: string, context?: LogContext): void
  error?(message: string, context?: LogContext): void
}

/**
 * Logger wrapper that supports optional logging
 */
export class SwarmLogger {
  private logger: Logger | null
  private debug: boolean
  private prefix: string

  constructor(logger?: Logger, debug = false, prefix = "[docker-swarm]") {
    this.logger = logger ?? null
    this.debug = debug
    this.prefix = prefix
  }

  /**
   * Set the logger instance
   */
  setLogger(logger: Logger): void {
    this.logger = logger
  }

  /**
   * Set debug mode
   */
  setDebug(debug: boolean): void {
    this.debug = debug
  }

  /**
   * Log debug message
   */
  debugFn(message: string, context?: LogContext): void {
    if (this.debug) {
      this.log("debug", message, context)
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const ctx = {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    this.log("error", message, ctx)
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = context?.module
      ? `${this.prefix}[${context.module}] ${message}`
      : `${this.prefix} ${message}`

    if (this.logger) {
      const logFn = this.logger[level]
      if (typeof logFn === "function") {
        logFn.call(this.logger, formattedMessage, context)
      }
    } else {
      // Fallback to console
      const consoleMethod = level === "debug" ? "log" : level === "error" ? "error" : level
      console[consoleMethod](formattedMessage, context ?? "")
    }
  }
}

/**
 * Create a child logger for a specific module
 */
export function createModuleLogger(_parent: SwarmLogger, module: string): SwarmLogger {
  return new SwarmLogger(undefined, false, `[docker-swarm:${module}]`)
}
