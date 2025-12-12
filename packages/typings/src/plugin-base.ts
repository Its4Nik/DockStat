import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockerClientEvents } from "./docker-client"
import type { PluginConfig } from "./plugins"

export interface PluginMeta {
  name: string
  description: string
  author: { name: string; website?: string; email?: string }
  version: string
  license: string
  tags: string[]
  repository: string
  path: string
}

export interface Plugin<T extends Record<string, unknown>, A extends PluginActions<T>> {
  meta: PluginMeta
  backendConfig: PluginConfig<T, A>
}

/**
 * Generic plugin action handler.
 * - `T` is the table row type for the plugin (if the plugin exposes a table)
 * - `K` is the payload/body type for this action (default: `unknown`)
 *
 * This alias is exported to make action handler signatures easier to reference.
 */
export type PluginActionHandler<T extends Record<string, unknown>, K = unknown> = (
  ctx: PluginActionContext<T, K>
) => Promise<unknown> | unknown

/**
 * Shared logger used by plugin action handlers.
 * Defined once here to keep the shape consistent and easy to reuse.
 */
export interface Logger {
  error(msg: string): void
  warn(msg: string): void
  info(msg: string): void
  debug(msg: string): void
}

/**
 * Context passed to a plugin action handler.
 * - `table` is a QueryBuilder for the plugin's table (or `null` if none)
 * - `body` is the action payload (if any)
 * - `logger` is a simple logging facade
 * - `previousAction` can be used to surface results from previous operations
 */
export interface PluginActionContext<T extends Record<string, unknown>, K = unknown> {
  table: QueryBuilder<T> | null
  body: K | undefined
  logger: Logger
  previousAction: unknown
}

/**
 * Map of action names to action handlers.
 * Each action may choose its own payload type via the generic in the handler.
 */
export type PluginActions<T extends Record<string, unknown>> = Record<
  string,
  <K = unknown>(ctx: PluginActionContext<T, K>) => Promise<unknown> | unknown
>

/**
 * RegisteredPlugin represents a plugin that has been loaded and registered with the host.
 * - `instance` is the concrete plugin implementation
 * - `routes` maps path => route metadata (HTTP method + actions exposed)
 * - `actions` is the resolved actions map available from the registered plugin
 */
export interface RegisteredPlugin<T extends Record<string, unknown>, A extends PluginActions<T>> {
  instance: Plugin<T, A>
  routes: Record<string, { method: string; actions: string[] }>
  actions: A
}

export interface PluginHooks extends DockerClientEvents {
  onServerBoot?: () => Promise<void> | void
}
