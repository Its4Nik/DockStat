/**
 * Supported log levels for the Docker client logger.
 * Ordered from most verbose to least verbose.
 */
export type LogLevel = "debug" | "info" | "warn" | "error"

/**
 * Logger configuration options.
 * Can be set via `ConnectionConfig.logger` or the `DOCKER_CLIENT_LOG_LEVEL` environment variable.
 */
export interface LoggerConfig {
  /** The minimum log level to output. Default: `"info"`. */
  level?: LogLevel
  /** Whether the logger is enabled. Default: `false`. */
  enabled?: boolean
  /** Optional custom write function for log output. Defaults to `console.error`. */
  write?: (message: string) => void
}

/** Numeric priorities for each log level (higher = more severe). */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  error: 3,
  info: 1,
  warn: 2,
}

/**
 * A lightweight, opt-in logger for the `@dockstat/docker` package.
 *
 * The logger is disabled by default. Enable it by either:
 * - Passing a `logger` config to `ConnectionConfig`
 * - Setting the `DOCKER_CLIENT_LOG_LEVEL` environment variable
 *
 * @example
 * ```ts
 * const logger = new DockerLogger({ level: "debug", enabled: true })
 * logger.debug("request started", { method: "GET", path: "/containers/json" })
 * ```
 */
export class DockerLogger {
  private readonly _level: LogLevel
  private readonly _enabled: boolean
  private readonly _write: (message: string) => void

  /**
   * Create a new DockerLogger instance.
   *
   * @param config - Logger configuration. If omitted or `enabled` is `false`, no output is produced.
   */
  constructor(config?: LoggerConfig) {
    this._level = config?.level ?? "info"
    this._enabled = config?.enabled ?? false
    this._write = config?.write ?? ((msg) => console.error(msg))
  }

  /** Whether this logger is currently enabled. */
  get enabled(): boolean {
    return this._enabled
  }

  /** The current minimum log level. */
  get level(): LogLevel {
    return this._level
  }

  /**
   * Log a debug-level message.
   * Only outputs if the logger is enabled and the configured level is `"debug"`.
   *
   * @param message - The log message.
   * @param data - Optional additional data to include.
   */
  debug(message: string, data?: unknown): void {
    this._log("debug", message, data)
  }

  /**
   * Log an info-level message.
   * Only outputs if the logger is enabled and the configured level is at most `"info"`.
   *
   * @param message - The log message.
   * @param data - Optional additional data to include.
   */
  info(message: string, data?: unknown): void {
    this._log("info", message, data)
  }

  /**
   * Log a warn-level message.
   * Only outputs if the logger is enabled and the configured level is at most `"warn"`.
   *
   * @param message - The log message.
   * @param data - Optional additional data to include.
   */
  warn(message: string, data?: unknown): void {
    this._log("warn", message, data)
  }

  /**
   * Log an error-level message.
   * Always outputs if the logger is enabled, regardless of the configured level.
   *
   * @param message - The log message.
   * @param data - Optional additional data to include.
   */
  error(message: string, data?: unknown): void {
    this._log("error", message, data)
  }

  /**
   * Create a child logger with the same configuration but an optional level override.
   *
   * @param overrides - Optional overrides for the child logger configuration.
   * @returns A new DockerLogger instance.
   */
  child(overrides?: LoggerConfig): DockerLogger {
    return new DockerLogger({
      enabled: overrides?.enabled ?? this._enabled,
      level: overrides?.level ?? this._level,
      write: overrides?.write ?? this._write,
    })
  }

  private _log(level: LogLevel, message: string, data?: unknown): void {
    if (!this._enabled) return
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this._level]) return

    const timestamp = new Date().toISOString()
    const prefix = `[docker:${level.toUpperCase()}] ${timestamp}`
    let output = `${prefix} ${message}`

    if (data !== undefined) {
      output += ` ${JSON.stringify(data)}`
    }

    this._write(output)
  }
}

/**
 * Resolve the log level from a logger configuration and/or the `DOCKER_CLIENT_LOG_LEVEL` environment variable.
 * The environment variable takes precedence over the config when set.
 *
 * @param config - Optional logger configuration.
 * @returns A resolved `LoggerConfig` with defaults applied.
 */
export function resolveLoggerConfig(config?: LoggerConfig | boolean): LoggerConfig {
  // Support shorthand `logger: true` to enable with default settings
  if (config === true) {
    return { enabled: true, level: "info" }
  }
  if (config === false || config === undefined) {
    return { enabled: false, level: "info" }
  }

  return {
    enabled: config.enabled ?? false,
    level: config.level ?? "info",
    write: config.write,
  }
}
