export * from "./plugin-base"

import type { ColumnDefinition } from "@dockstat/sqlite-wrapper"
import type { Parser } from "@dockstat/sqlite-wrapper/types"
import type { PluginActions } from "./plugin-base"

/* PluginRoute defines the API route configuration for a plugin action */
export type PluginRoute<
  T extends Record<string, unknown> = Record<string, unknown>,
  A extends PluginActions<T> = PluginActions<T>,
> = {
  method: "GET" | "POST"
  actions: (keyof A)[]
}

/**
 * Frontend route configuration for plugin UI pages
 */
export interface PluginFrontendRoute {
  /** Route path (e.g., "/dashboard", "/settings") */
  path: string
  /** JSON/YAML template string or parsed template object */
  template: unknown
  /** Route metadata */
  meta?: {
    title?: string
    icon?: string
    showInNav?: boolean
    navOrder?: number
    [key: string]: unknown
  }
}

/**
 * Frontend configuration for plugin UI
 */
export interface PluginFrontendConfig {
  /** Frontend routes provided by this plugin */
  routes?: PluginFrontendRoute[]
  /** Shared template fragments available to all routes */
  sharedFragments?: unknown[]
  /** Global state shared across routes */
  globalState?: {
    initial: Record<string, unknown>
    computed?: Record<string, string>
  }
}

/* PluginConfig defines the complete configuration for a plugin */
export type PluginConfig<T extends Record<string, unknown>, A extends PluginActions<T>> = {
  table?: {
    name: string
    parser: Parser<T>
    columns: Record<string, ColumnDefinition>
  }
  apiRoutes?: Record<string, PluginRoute<T, A>>
  actions?: PluginActions<T>
  /** Frontend configuration for plugin UI */
  frontend?: PluginFrontendConfig
}

// Helper type to validate that actions exist in A
export type ValidatedPluginRoute<
  T extends Record<string, unknown>,
  A extends PluginActions<T>,
  K extends string,
> = PluginRoute<T, A> & {
  actions: Extract<keyof A, K>[] // Ensures all actions actually exist in A
}
