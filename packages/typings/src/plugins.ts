export * from "./plugin-base"

import type { ColumnDefinition } from "@dockstat/sqlite-wrapper"
import type { Parser } from "@dockstat/sqlite-wrapper/types"
import type { PluginActions } from "./plugin-base"

/**
 * PluginRoute defines the API route configuration for plugin actions.
 * - T: plugin table row type
 * - A: actions map from the plugin
 */
export type PluginRoute<
  T extends Record<string, unknown> = Record<string, unknown>,
  A extends PluginActions<T> = PluginActions<T>,
> = {
  method: "GET" | "POST"
  actions: (keyof A)[]
}

/**
 * FrontendRoute
 * Placeholder type for frontend route definitions (kept broad intentionally to avoid coupling).
 */
export type FrontendRoute = Record<string, unknown>

/**
 * PluginConfig defines the complete configuration for a plugin.
 * - table: optional table descriptor (with parser/columns and optional jsonColumns)
 * - apiRoutes: optional mapping of API routes to PluginRoute definitions
 * - actions: optional actions map typed as A for stronger inference
 */
export type PluginConfig<T extends Record<string, unknown>, A extends PluginActions<T>> = {
  table?: {
    name: string
    parser: Parser<T>
    columns: Record<string, ColumnDefinition>
    jsonColumns?: (keyof T)[]
  }
  apiRoutes?: Record<string, PluginRoute<T, A>>
  actions?: A
}

/**
 * ValidatedPluginRoute
 *
 * Ensures that the actions listed on a route actually exist on the plugin's actions map `A`.
 * The `K` generic from the prior version was redundant/overly complex for call sites; this
 * variant keeps the constraint straightforward and easier to use.
 */
export type ValidatedPluginRoute<
  T extends Record<string, unknown>,
  A extends PluginActions<T>,
> = PluginRoute<T, A> & {
  actions: Extract<keyof A, string>[] // Ensures all actions actually exist in A
}
