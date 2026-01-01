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
      `Logger Status: ${this.disabled ? "disabled" : "active"} - ignoring messages: ${ignoreMessages.join(", ")}`
    )
  }

  setLogHook(hook: LogHook) {
    this.logHook = hook
  }

  private emitLogEntry(level: LogLevel, message: string, requestId?: string) {
    if (this.logHook) {
      this.logHook({
        level,
        message,
        name: this.name,
        parents: this.parents,
        requestId,
        timestamp: new Date(),
        caller: getCallerInfo(),
      })
    }
  }

  spawn(prefix: string, additionalParents?: string[]) {
    return new Logger(
      prefix,
      [this.name, ...(additionalParents || []), ...this.parents],
      this.logHook
    )
  }

  error(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("error")) {
      console.error(this.formatMessage("error", msg, requestid))
      this.emitLogEntry("error", msg, requestid)
    }
  }

  warn(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("warn")) {
      console.warn(this.formatMessage("warn", msg, requestid))
      this.emitLogEntry("warn", msg, requestid)
    }
  }

  info(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("info")) {
      console.info(this.formatMessage("info", msg, requestid))
      this.emitLogEntry("info", msg, requestid)
    }
  }

  debug(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages) && shouldLog("debug")) {
      console.debug(this.formatMessage("debug", msg, requestid))
      this.emitLogEntry("debug", msg, requestid)
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

    const prefix = `${timestamp} ${levelTag} ${requestTag}[${nameChain}] ${callerInfo}`
    return `${prefix} — ${chalk.grey(message)}`
  }
}

export type { LogHook, LogEntry }

export { Logger }
export default Logger
