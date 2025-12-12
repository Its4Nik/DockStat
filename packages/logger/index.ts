import chalk from "chalk"
import sourceMapSupport from "source-map-support"

sourceMapSupport.install()

let callerMatchesDepth = 2
let ignoreMessages: string[] = []

if (Bun.env.DOCKSTAT_LOGGER_FULL_FILE_PATH === "true") {
  callerMatchesDepth = 1
}

if (Bun.env.DOCKSTAT_LOGGER_IGNORE_MESSAGES) {
  ignoreMessages = Bun.env.DOCKSTAT_LOGGER_IGNORE_MESSAGES.split(",")
}

const DISABLED_LOGGERS: string[] = (Bun.env.DOCKSTAT_LOGGER_DISABLED_LOGGERS || "").split(",")
const ONLY_SHOW: string[] = (Bun.env.DOCKSTAT_LOGGER_ONLY_SHOW || "").split(",")
const NAME_SEP: string = Bun.env.DOCKSTAT_LOGGER_SEPERATOR || ":"

function stringToHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

// Convert hash to a color (HSL → RGB)
function hashToColor(hash: number): [number, number, number] {
  const h = Math.abs(hash) % 360 // hue
  const s = 70 // saturation
  const l = 60 // lightness
  return hslToRgb(h, s, l)
}

// HSL → RGB conversion
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const ps = s / 100
  const pl = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = ps * Math.min(pl, 1 - pl)
  const f = (n: number) => pl - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [255 * f(0), 255 * f(8), 255 * f(4)]
}

// Helper to get file and line info from stack trace
function getCallerInfo(): string {
  const stack = new Error().stack?.split("\n")
  if (stack) {
    for (let i = 4; i < stack.length; i++) {
      const stackVal = stack[i]
      if (stackVal) {
        const line = stackVal.trim()
        const matches = line.match(/\(?(.+):(\d+):(\d+)\)?$/)
        if (matches) {
          if (matches[1]) {
            return `${matches[1].split("/").pop()}:${matches[callerMatchesDepth]}`
          }
        }
      }
    }
  }
  return ""
}

type LogLevel = "error" | "warn" | "info" | "debug"

const levelColors: Record<LogLevel, (msg: string) => string> = {
  error: chalk.red.bold,
  warn: chalk.yellow.bold,
  info: chalk.green.bold,
  debug: chalk.blue.bold,
}

const shouldIgnore = (msg: string, ignoreMessages: string[]) => {
  const lower = msg.toLowerCase()
  return ignoreMessages.some((s) => lower.includes(s.toLowerCase()))
}

class Logger {
  protected name: string
  protected parents: string[] = []
  public reqFrom: Record<string, string | undefined> = {}
  public disabled: boolean

  constructor(prefix: string, parents: string[] = []) {
    this.name = prefix
    this.parents = parents

    this.disabled = DISABLED_LOGGERS.includes(prefix)

    if (ONLY_SHOW.length > 1) {
      this.disabled = !ONLY_SHOW.includes(prefix) === true ? true : this.disabled
    }
    this.debug(
      `Logger Status: ${this.disabled ? "disabled" : "active"} - ignoring messages: ${ignoreMessages.join(", ")}`
    )
  }

  spawn(prefix: string, additionalParents?: string[]) {
    return new Logger(prefix, [this.name, ...(additionalParents || []), ...this.parents])
  }

  error(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages))
      console.error(this.formatMessage("error", msg, requestid))
  }

  warn(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages))
      console.warn(this.formatMessage("warn", msg, requestid))
  }

  info(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages))
      console.info(this.formatMessage("info", msg, requestid))
  }

  debug(msg: string, requestid?: string) {
    if (!this.disabled && !shouldIgnore(msg, ignoreMessages))
      console.debug(this.formatMessage("debug", msg, requestid))
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
    const timestamp = chalk.magenta(new Date().toISOString().slice(11, 19)) // HH:mm:ss

    const levelTag = levelColors[level](level.toUpperCase().padEnd(5, " "))

    const callerInfo = chalk.blue(getCallerInfo())

    const nameChain =
      this.parents.length > 0
        ? `${chalk.cyan(this.name)}${chalk.yellow(NAME_SEP + this.parents.join(NAME_SEP))}`
        : chalk.cyan(this.name)

    const reqFrom = requestID && this.reqFrom[requestID]
    const requestTag =
      requestID != null
        ? chalk.gray(
            `(${this.colorByReqID(requestID)}${reqFrom ? `@${chalk.green(reqFrom)}` : ""}) `
          )
        : ""

    const prefix = `${timestamp} ${levelTag} ${requestTag}[${nameChain}] ${callerInfo}`

    return `${prefix} — ${chalk.grey(message)}`
  }

  private cleanReqId(reqId: string): string {
    if (reqId.includes("|")) {
      const parts = reqId.split("|")
      this.reqFrom[reqId] = parts[1] ?? undefined
      return parts[0] ?? ""
    }
    return reqId
  }

  private colorByReqID(rawReqId?: string): string {
    if (!rawReqId) return ""
    const reqId = this.cleanReqId(rawReqId)
    const hash = stringToHash(reqId)
    const [r, g, b] = hashToColor(hash)
    return chalk.rgb(Math.round(r), Math.round(g), Math.round(b))(reqId)
  }
}

export { Logger }
export default Logger
