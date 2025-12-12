export * from "./plugin-base"

import type { ColumnDefinition } from "@dockstat/sqlite-wrapper"
import type { Parser } from "@dockstat/sqlite-wrapper/types"
import type { Plugin, PluginActions } from "./plugin-base"

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
 * The optional generic `K` allows callers to narrow the set of action keys to a subset of
 * `A`'s keys while still validating that those keys belong to `A`. By default `K` includes
 * all string keys of `A`.
 */
export type ValidatedPluginRoute<
  T extends Record<string, unknown>,
  A extends PluginActions<T>,
  K extends keyof A & string = Extract<keyof A, string>,
> = PluginRoute<T, A> & {
  actions: K[] // Ensures all listed actions belong to A and are constrained by K
}

/* ---------------------------------------------------------------------------
   Cross-plugin action calling (type-level helpers)
   ---------------------------------------------------------------------------
   These types define a type-safe outline for calling actions exposed by another
   plugin. They are type-level only and are intended to be consumed by host-side
   invokers or plugin authors to get strong inference for payload and return
   types when invoking actions across plugin boundaries.

   - If a plugin has no known actions, `ExtractActions` falls back to
     `Record<string, unknown>` so calls degrade to `unknown` payload/return types.
   --------------------------------------------------------------------------- */

/** Extract the actions map type from a `Plugin` type; fallback to a generic map. */
export type ExtractActions<P> = P extends Plugin<infer _T, infer A> ? A : Record<string, unknown>

/** Infer the payload/body type from an action function signature.
 *  If the action fn receives a `ctx` with a `body` field, use that type; otherwise `unknown`.
 */
export type ActionFnPayload<F> = F extends (ctx: infer C) => unknown
  ? C extends { body: infer B }
    ? B
    : C extends { body?: infer B2 }
      ? B2
      : unknown
  : unknown

/** Infer the action's return type (unwrapping Promise if present). */
export type ActionFnReturn<F> = F extends (...args: unknown[]) => infer R
  ? R extends Promise<infer U>
    ? U
    : R
  : unknown

/**
 * CrossPluginCaller
 *
 * A typed caller shape that hosts can implement to provide runtime cross-plugin
 * invocation. `PluginsMap` represents an index of plugin keys to their Plugin
 * types (or `unknown` when not available at compile-time). The `call` method
 * will infer the payload and return types for known actions; unknown plugins
 * or actions fall back to `unknown`.
 */
export type CrossPluginCaller<
  PluginsMap extends Record<string, unknown>,
  Name extends keyof PluginsMap = keyof PluginsMap,
> = {
  call<
    PName extends Name,
    Actions extends ExtractActions<NonNullable<PluginsMap[PName]>>,
    ActionName extends keyof Actions & string = keyof Actions & string,
  >(
    pluginName: PName,
    action: ActionName,
    payload?: ActionFnPayload<Actions[ActionName]>
  ): Promise<ActionFnReturn<Actions[ActionName]>>
}
