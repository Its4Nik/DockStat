import chalk from "chalk"
import { DISABLED_LOGGERS, ignoreMessages, NAME_SEP, ONLY_SHOW } from "./config"
import type { LogEntry, LogHook, LogLevel } from "./types"
import { colorByReqID, getCallerInfo, levelColors, shouldIgnore, shouldLog } from "./utils"

class Logger {
  protected name: string
  protected parents: string[] = []
  public reqFrom: Record<string, string> = {}
  private logHook?: LogHook
  public disabled: boolean

  constructor(prefix: string, parents: string[] = [], logHook?: LogHook) {
    this.name = prefix
    this.parents = parents
    this.logHook = logHook

    this.disabled = DISABLED_LOGGERS.includes(prefix)

    if (ONLY_SHOW.length > 1) {
      this.disabled = !ONLY_SHOW.includes(prefix) ? true : this.disabled
    }
    this.debug(
      `Logger Status: ${this.disabled ? "disabled" : "active"} - ignoring messages: ${ignoreMessages.join(", ")} - logHook: ${this.logHook?.toString}`
    )
  }

  setLogHook(hook: LogHook) {
    this.logHook = hook
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
    if (this.logHook) {
      this.logHook({
        level,
        message,
        name: meta?.name || this.name,
        parents: meta?.parents || this.parents,
        requestId: meta?.requestId,
        timestamp: meta?.timestamp || new Date(),
        caller: meta?.caller || getCallerInfo(),
      })
    }
  }

  spawn(prefix: string, additionalParents?: string[]) {
    this.debug(`Spawned ${prefix}`)
    return new Logger(
      prefix,
      [this.name, ...(additionalParents || []), ...this.parents],
      this.logHook
    )
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

    const nameChain =
      this.parents.length > 0
        ? `${chalk.cyan(this.name)}${chalk.yellow(NAME_SEP + this.parents.join(NAME_SEP))}`
        : chalk.cyan(this.name)

    let requestTag = ""
    if (requestID != null) {
      const { id: coloredId, from: extractedFrom } = colorByReqID(requestID)
      const storedFrom = this.reqFrom[requestID]
      const displayFrom = storedFrom || extractedFrom
      requestTag = chalk.gray(`(${coloredId}${displayFrom ? `@${chalk.green(displayFrom)}` : ""}) `)
    }

    const hasHook = typeof this.logHook === "function"

    const prefix = `${timestamp} ${levelTag} ${requestTag}[${nameChain}] ${callerInfo}`
    return `${prefix} ${hasHook ? hook : "—"} ${chalk.grey(message)}`
  }
}

export type { LogHook, LogEntry }

export { Logger }
export default Logger
