import type { DB, QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockerClientEvents } from "./docker-client"
import type { PluginConfig } from "./plugins"

export interface PluginRecord extends Record<string, unknown> {
  id?: number
  meta: PluginMeta
  plugin: {
    backendConfig: PluginConfig<any, any>
    actions: PluginActions<any>
    frontendConfig?: unknown
  }
}

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

export type PluginActionHandler<T extends Record<string, unknown>> = <K = undefined>(
  ctx: PluginActionContext<T, K>
) => Promise<unknown> | unknown

export interface PluginActionContext<T extends Record<string, unknown>, K = unknown> {
  table: QueryBuilder<T> | null
  body: K | undefined
  logger: {
    error: (msg: string) => void
    warn: (msg: string) => void
    info: (msg: string) => void
    debug: (msg: string) => void
  }
  previousAction: unknown
}

export type PluginActions<T extends Record<string, unknown>> = Record<
  string,
  <K = unknown>(ctx: PluginActionContext<T, K>) => Promise<unknown> | unknown
>

export interface RegisteredPlugin<T extends Record<string, unknown>, A extends PluginActions<T>> {
  instance: Plugin<T, A>
  routes: Record<string, { method: string; actions: string[] }>
  actions: A
}

export interface PluginHooks extends DockerClientEvents {
  onServerBoot?: () => Promise<void> | void
}
