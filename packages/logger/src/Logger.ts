import chalk from "chalk"
import { DISABLED_LOGGERS, ignoreMessages, NAME_SEP, ONLY_SHOW } from "./config"
import type { LogEntry, LogHook, LogLevel } from "./types"
import {
  colorByReqID,
  colorName,
  getCallerInfo,
  levelColors,
  shouldIgnore,
  shouldLog,
} from "./utils"

class Logger {
  protected loggerMap = new Set<Logger>()
  protected name: string
  protected parents: string[] = []
  public reqFrom: Record<string, string> = {}
  public disabled: boolean

  // Root reference system - hook lives only in root
  private _root!: Logger
  private _logHook?: LogHook
  // Re-entrancy guard: lives on root, prevents the hook from re-firing
  // while it is already executing (e.g. when the hook itself logs).
  private _emitting = false

  constructor(prefix: string, parents: string[] = [], logHook?: LogHook) {
    this.name = prefix
    this.parents = parents

    // Root logger initializes itself as root
    if (parents.length === 0) {
      this._root = this
      this._logHook = logHook
    }

    this.disabled = DISABLED_LOGGERS.includes(prefix)

    if (ONLY_SHOW.length > 1) {
      this.disabled = !ONLY_SHOW.includes(prefix) ? true : this.disabled
    }

    // Defer debug log for children until linked to root
    if (parents.length === 0) {
      this.debug(
        `Logger Status: ${this.disabled ? "disabled" : "active"} - ignoring messages: ${ignoreMessages.join(", ")} - logHook: ${this.logHook?.toString}`
      )
    }
  }

  /**
   * Link child logger to root. Called internally by spawn().
   */
  private linkToRoot(root: Logger) {
    this._root = root
    this.debug(
      `Logger Status: ${this.disabled ? "disabled" : "active"} - ignoring messages: ${ignoreMessages.join(", ")} - logHook: ${this.logHook?.toString}`
    )
  }

  /**
   * Access the root logger's hook.
   * All loggers in the tree share the same hook via this getter.
   */
  private get logHook(): LogHook | undefined {
    return this._root?._logHook
  }

  setLogHook(hook: LogHook) {
    // Set on root - all children automatically see it via the getter
    this._root._logHook = hook

    this.info(`Set log hook for: ${this.name}`)

    // Log affected loggers for visibility
    this._logAffectedLoggers(this._root)
  }

  /** Recursively log which loggers are affected by the hook */
  private _logAffectedLoggers(logger: Logger) {
    for (const child of logger.loggerMap.values()) {
      this.debug(`-> Set log hook for: ${child.name}`)
      this._logAffectedLoggers(child)
    }
  }

  public emitLogEntry(
    level: LogLevel,
    message: string,
    meta?: {
      requestId?: string
      parents?: string[]
      name?: string
      caller?: string
      timestamp?: Date
    }
  ) {
    const root = this._root
    // Re-entrancy guard: if the hook is currently running (and therefore
    // producing logs itself), don't re-invoke it. This prevents infinite
    // recursion when the hook's execution path logs through a logger that
    // shares this same root hook.
    if (this.logHook && !root._emitting) {
      root._emitting = true
      try {
        this.logHook({
          caller: meta?.caller || getCallerInfo(),
          level,
          message,
          name: meta?.name || this.name,
          parents: meta?.parents || this.parents,
          requestId: meta?.requestId,
          timestamp: meta?.timestamp || new Date(),
        })
      } finally {
        root._emitting = false
      }
    }
  }

  spawn(prefix: string, additionalParents?: string[]) {
    // Create child without passing hook - it will use root's hook via getter
    const logger = new Logger(prefix, [this.name, ...(additionalParents || []), ...this.parents])

    // Link child to the root logger
    logger.linkToRoot(this._root)

    this.loggerMap.add(logger)

    this.debug(`Spawned ${prefix}`)
    return logger
  }

  error(msg: string, requestId?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("error")) {
      console.error(this.formatMessage("error", msg, requestId))
      this.emitLogEntry("error", msg, { requestId })
    }
  }

  warn(msg: string, requestId?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("warn")) {
      console.warn(this.formatMessage("warn", msg, requestId))
      this.emitLogEntry("warn", msg, { requestId })
    }
  }

  info(msg: string, requestId?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("info")) {
      console.info(this.formatMessage("info", msg, requestId))
      this.emitLogEntry("info", msg, { requestId })
    }
  }

  debug(msg: string, requestId?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("debug")) {
      console.debug(this.formatMessage("debug", msg, requestId))
      this.emitLogEntry("debug", msg, { requestId })
    }
  }

  setDisabled(to: boolean) {
    this.disabled = to
  }

  getParents(): string[] {
    return this.parents
  }

  getParentsForLoggerChaining(): string[] {
    return [this.name, ...this.parents]
  }

  addParent(prefix: string) {
    this.parents = [prefix, ...this.parents]
    return this.parents
  }

  addParents(parents: string[]) {
    this.parents = parents
  }

  setReqFrom(reqId: string, from: string) {
    this.reqFrom[reqId] = from
  }

  clearReqFrom(reqId: string) {
    this.reqFrom[reqId] = ""
  }

  private formatMessage(level: LogLevel, message: string, requestID?: string) {
    const timestamp = chalk.magenta(new Date().toISOString().slice(11, 19))
    const levelTag = levelColors[level](level.toUpperCase().padEnd(5, " "))
    const callerInfo = chalk.blue(getCallerInfo())
    const hook = chalk.green("—>")

    const coloredName = colorName(this.name)

    const nameChain =
      this.parents.length > 0
        ? `${coloredName}${chalk.yellow(NAME_SEP + this.parents.join(NAME_SEP))}`
        : coloredName

    let requestTag = ""
    if (requestID != null) {
      const { id: coloredId, from: extractedFrom } = colorByReqID(requestID)
      const storedFrom = this.reqFrom[requestID]
      const displayFrom = storedFrom || extractedFrom
      requestTag = chalk.gray(` (${coloredId}${displayFrom ? `@${chalk.green(displayFrom)}` : ""})`)
    }

    const hasHook = typeof this.logHook === "function"

    const prefixStr = `${timestamp} ${levelTag} [${nameChain}${requestTag}] ${callerInfo}`
    return `${prefixStr} ${hasHook ? hook : "—"} ${chalk.grey(message)}`
  }
}

export type { LogHook, LogEntry }

export { Logger }
export default Logger
