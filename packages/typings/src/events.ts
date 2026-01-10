import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockerClientEvents } from "./docker-client"
import type { DockerStreamManagerProxy } from "./docker-monitoring-manager"

export type LogLevel = "error" | "warn" | "info" | "debug"

export type LogEntry = {
  level: LogLevel
  message: string
  name: string
  parents: string[]
  requestId?: string
  timestamp: Date
  caller: string
}

type workerLoggerResponse = {
  __log__: (ctx: LogEntry) => void
}

type BaseEvents = DockerClientEvents & DockerStreamManagerProxy & workerLoggerResponse

type ExtentWithExtraObject<E, ExtraArgs extends Record<string, unknown>> = {
  [K in keyof E]: E[K] extends (...args: infer A) => void
    ? (...args: [...A, ExtraArgs]) => unknown
    : E[K]
}
type loggerFunction = (msg: string) => void

type logger = {
  debug: loggerFunction
  info: loggerFunction
  warn: loggerFunction
  error: loggerFunction
}

type ServerEvents<T extends Record<string, unknown> = Record<string, unknown>> = {
  table: QueryBuilder<T>
  logger: logger
}

export type EVENTS<Table extends Record<string, unknown> = Record<string, unknown>> =
  ExtentWithExtraObject<BaseEvents, ServerEvents<Table>>
