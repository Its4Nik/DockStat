import sourceMapSupport from "source-map-support"
import type { LogLevel } from "./types"

sourceMapSupport.install()

export const callerMatchesDepth: number = Bun.env.DOCKSTAT_LOGGER_FULL_FILE_PATH === "true" ? 1 : 2

export const ignoreMessages: string[] = Bun.env.DOCKSTAT_LOGGER_IGNORE_MESSAGES
  ? Bun.env.DOCKSTAT_LOGGER_IGNORE_MESSAGES.split(",")
  : []

export const DISABLED_LOGGERS: string[] = (Bun.env.DOCKSTAT_LOGGER_DISABLED_LOGGERS || "").split(
  ","
)

export const ONLY_SHOW: string[] = (Bun.env.DOCKSTAT_LOGGER_ONLY_SHOW || "").split(",")

export const NAME_SEP: string = Bun.env.DOCKSTAT_LOGGER_SEPERATOR || ":"

const DEFAULT_LOG_LEVEL: LogLevel = "debug"

const envLevel = (Bun.env.DOCKSTAT_LOGGER_LEVEL || "").toLowerCase()

export const LOG_LEVEL: LogLevel = ["error", "warn", "info", "debug"].includes(envLevel)
  ? (envLevel as LogLevel)
  : DEFAULT_LOG_LEVEL
