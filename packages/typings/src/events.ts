import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockerClientEvents } from "./docker-client"
import type { DockerStreamManagerProxy } from "./docker-monitoring-manager"

type BaseEvents = DockerClientEvents & DockerStreamManagerProxy

// Append an extra server context argument to each event handler function in E.
// Non-function properties are left unchanged. The handler's original return type is preserved.
type AppendServerContext<E, ExtraArgs extends Record<string, unknown>> = {
  [K in keyof E]: E[K] extends (...args: infer A) => infer R
    ? (...args: [...A, ExtraArgs]) => R
    : E[K]
}

type LoggerFn = (msg: string) => void

type Logger = {
  debug: LoggerFn
  info: LoggerFn
  warn: LoggerFn
  error: LoggerFn
}

// The context injected into each server-side event handler.
// Exported so it can be reused elsewhere if needed.
export type ServerContext<T extends Record<string, unknown> = Record<string, unknown>> = {
  table: QueryBuilder<T>
  logger: Logger
}

/**
 * EVENTS<T>
 *
 * Represents the runtime event map extended for server-side handlers.
 * For each event handler function in the underlying event map (BaseEvents),
 * the handler signature is augmented to receive an additional last argument:
 *   ServerContext<T>
 *
 * The original argument tuple and return type are preserved.
 */
export type EVENTS<T extends Record<string, unknown> = Record<string, unknown>> =
  AppendServerContext<BaseEvents, ServerContext<T>>
