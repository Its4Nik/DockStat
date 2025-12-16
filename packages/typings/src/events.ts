import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockerClientEvents } from "./docker-client"
import type { DockerStreamManagerProxy } from "./docker-monitoring-manager"

type BaseEvents = DockerClientEvents & DockerStreamManagerProxy

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

export type EVENTS<T extends Record<string, unknown> = Record<string, unknown>> =
  ExtentWithExtraObject<BaseEvents, ServerEvents<T>>
