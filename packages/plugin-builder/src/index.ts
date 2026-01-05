import type { ColumnDefinition } from "@dockstat/sqlite-wrapper"
import type { Parser } from "@dockstat/sqlite-wrapper/types"
import type {
  EVENTS,
  FrontendAction,
  FrontendLoader,
  PluginActionContext,
  PluginActions,
  PluginConfig,
  PluginFrontendConfig,
  PluginFrontendRoute,
  PluginRoute,
} from "@dockstat/typings"

export { column } from "@dockstat/sqlite-wrapper"

/**
 * Plugin author information
 */
export interface PluginAuthor {
  name: string
  website?: string
  email?: string
  license?: string
}

/**
 * Complete plugin metadata
 */
export interface PluginMeta {
  name: string
  description: string
  version: string
  repository: string
  repoType: "github" | "gitlab" | "local" | "default"
  manifest: string
  author: PluginAuthor
  tags?: string[]
}

/**
 * Table configuration for a plugin
 */
export interface TableConfig<T extends Record<string, unknown>> {
  name: string
  columns: Record<keyof T, ColumnDefinition>
  parser: Parser<T>
}

/**
 * Complete plugin definition with full type safety
 */
export interface PluginDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
  A extends PluginActions<T> = PluginActions<T>,
> extends PluginMeta {
  config?: PluginConfig<T, A>
  events?: Partial<EVENTS<T>>
  init?: () => void | Promise<void>
}

/**
 * Builder result type
 */
export type BuiltPlugin<
  T extends Record<string, unknown>,
  A extends PluginActions<T>,
> = PluginDefinition<T, A>

/**
 * Action handler type for type inference
 */
export type ActionHandler<T extends Record<string, unknown>, TBody = unknown, TReturn = unknown> = (
  ctx: PluginActionContext<T, TBody>
) => TReturn | Promise<TReturn>

/**
 * Create a type-safe action handler
 */
export function createAction<T extends Record<string, unknown>, TBody = unknown, TReturn = unknown>(
  handler: ActionHandler<T, TBody, TReturn>
): ActionHandler<T, TBody, TReturn> {
  return handler
}

/**
 * Create type-safe actions object
 */
export function createActions<T extends Record<string, unknown>, A = PluginActions<T>>(
  actions: A
): A {
  return actions
}

/**
 * Create a type-safe API route
 */
export function createRoute<
  T extends Record<string, unknown>,
  A extends PluginActions<T>,
  K extends keyof A,
>(route: { method: "GET" | "POST"; actions: K[] }): PluginRoute<T, A> {
  return route as PluginRoute<T, A>
}

/**
 * Create type-safe API routes object
 */
export function createApiRoutes<T extends Record<string, unknown>, A extends PluginActions<T>>(
  routes: Record<string, PluginRoute<T, A>>
): Record<string, PluginRoute<T, A>> {
  return routes
}

/**
 * Create a type-safe table configuration
 */
export function createTable<T extends Record<string, unknown>>(
  config: TableConfig<T>
): TableConfig<T> {
  return config
}

/**
 * Create type-safe event handlers
 */
export function createEvents<T extends Record<string, unknown>>(
  events: Partial<EVENTS<T>>
): Partial<EVENTS<T>> {
  return events
}

/**
 * Create a frontend route configuration
 */
export function createFrontendRoute(route: PluginFrontendRoute): PluginFrontendRoute {
  return route
}

/**
 * Create frontend routes array
 */
export function createFrontendRoutes(routes: PluginFrontendRoute[]): PluginFrontendRoute[] {
  return routes
}

/**
 * Create a frontend loader configuration
 */
export function createFrontendLoader(loader: FrontendLoader): FrontendLoader {
  return loader
}

/**
 * Create a frontend action configuration
 */
export function createFrontendAction(action: FrontendAction): FrontendAction {
  return action
}

/**
 * Create complete frontend configuration
 */
export function createFrontendConfig(config: PluginFrontendConfig): PluginFrontendConfig {
  return config
}

/**
 * Plugin builder class for fluent API
 */
export class PluginBuilder<
  T extends Record<string, unknown> = Record<string, unknown>,
  A extends PluginActions<T> = PluginActions<T>,
> {
  private plugin: Partial<PluginDefinition<T, A>> = {}

  /**
   * Set plugin metadata
   */
  meta(meta: PluginMeta): this {
    this.plugin = { ...this.plugin, ...meta }
    return this
  }

  /**
   * Set plugin name
   */
  name(name: string): this {
    this.plugin.name = name
    return this
  }

  /**
   * Set plugin description
   */
  description(description: string): this {
    this.plugin.description = description
    return this
  }

  /**
   * Set plugin version
   */
  version(version: string): this {
    this.plugin.version = version
    return this
  }

  /**
   * Set plugin repository info
   */
  repository(
    repository: string,
    repoType: "github" | "gitlab" | "local" | "default" = "github"
  ): this {
    this.plugin.repository = repository
    this.plugin.repoType = repoType
    return this
  }

  /**
   * Set plugin manifest URL
   */
  manifest(manifest: string): this {
    this.plugin.manifest = manifest
    return this
  }

  /**
   * Set plugin author
   */
  author(author: PluginAuthor): this {
    this.plugin.author = author
    return this
  }

  /**
   * Set plugin tags
   */
  tags(tags: string[]): this {
    this.plugin.tags = tags
    return this
  }

  /**
   * Ensure config exists and return it
   */
  private ensureConfig(): PluginConfig<T, A> {
    if (!this.plugin.config) {
      this.plugin.config = {} as PluginConfig<T, A>
    }
    return this.plugin.config
  }

  /**
   * Set plugin table configuration
   */
  table(tableConfig: TableConfig<T>): this {
    this.ensureConfig().table = tableConfig
    return this
  }

  /**
   * Set plugin actions
   */
  actions(actions: A): this {
    this.ensureConfig().actions = actions
    return this
  }

  /**
   * Set plugin API routes
   */
  apiRoutes(routes: Record<string, PluginRoute<T, A>>): this {
    this.ensureConfig().apiRoutes = routes
    return this
  }

  /**
   * Set plugin frontend configuration
   */
  frontend(config: PluginFrontendConfig): this {
    this.ensureConfig().frontend = config
    return this
  }

  /**
   * Set plugin event handlers
   */
  events(events: Partial<EVENTS<T>>): this {
    this.plugin.events = events
    return this
  }

  /**
   * Set plugin initialization function
   */
  init(initFn: () => void | Promise<void>): this {
    this.plugin.init = initFn
    return this
  }

  /**
   * Set complete plugin config at once
   */
  config(config: PluginConfig<T, A>): this {
    this.plugin.config = config
    return this
  }

  /**
   * Build and return the complete plugin definition
   */
  build(): BuiltPlugin<T, A> {
    // Validate required fields
    if (!this.plugin.name) {
      throw new Error("Plugin name is required")
    }
    if (!this.plugin.description) {
      throw new Error("Plugin description is required")
    }
    if (!this.plugin.version) {
      throw new Error("Plugin version is required")
    }
    if (!this.plugin.repository) {
      throw new Error("Plugin repository is required")
    }
    if (!this.plugin.manifest) {
      throw new Error("Plugin manifest is required")
    }
    if (!this.plugin.author) {
      throw new Error("Plugin author is required")
    }
    if (!this.plugin.repoType) {
      this.plugin.repoType = "github"
    }

    return this.plugin as BuiltPlugin<T, A>
  }
}

/**
 * Create a new plugin builder instance
 */
export function pluginBuilder<
  T extends Record<string, unknown> = Record<string, unknown>,
  A extends PluginActions<T> = PluginActions<T>,
>(): PluginBuilder<T, A> {
  return new PluginBuilder<T, A>()
}

/**
 * Define a complete plugin with full type safety (functional approach)
 *
 * @example
 * ```typescript
 * import { definePlugin, createActions, createRoute } from "@dockstat/plugin-handler/builder"
 * import { column } from "@dockstat/sqlite-wrapper"
 *
 * // Define your table schema type
 * interface MyPluginData {
 *   id: number
 *   name: string
 *   settings: Record<string, unknown>
 * }
 *
 * // Create type-safe actions
 * const actions = createActions<MyPluginData>({
 *   getData: async ({ table, logger }) => {
 *     logger.info("Fetching data")
 *     return table?.select(["*"]).all() ?? []
 *   },
 *   saveData: async ({ table, body, logger }) => {
 *     logger.info("Saving data")
 *     const result = table?.insert(body as MyPluginData)
 *     return { success: true, id: result?.lastInsertRowid }
 *   }
 * })
 *
 * // Define the plugin
 * export default definePlugin<MyPluginData, typeof actions>({
 *   name: "my-plugin",
 *   description: "A sample plugin",
 *   version: "1.0.0",
 *   repository: "https://github.com/user/my-plugin",
 *   repoType: "github",
 *   manifest: "https://github.com/user/my-plugin/manifest.json",
 *   author: { name: "Developer", email: "dev@example.com" },
 *   tags: ["sample", "demo"],
 *
 *   config: {
 *     table: {
 *       name: "my_plugin_data",
 *       columns: {
 *         id: column.id(),
 *         name: column.text({ notNull: true }),
 *         settings: column.json()
 *       },
 *       parser: { JSON: ["settings"] }
 *     },
 *     actions,
 *     apiRoutes: {
 *       "/data": { method: "GET", actions: ["getData"] },
 *       "/save": { method: "POST", actions: ["saveData"] }
 *     }
 *   },
 *
 *   events: {
 *     onContainerStart: async (container, { logger }) => {
 *       logger.info(`Container started: ${container.id}`)
 *     }
 *   }
 * })
 * ```
 */
export function definePlugin<
  T extends Record<string, unknown> = Record<string, unknown>,
  A extends PluginActions<T> = PluginActions<T>,
>(definition: PluginDefinition<T, A>): PluginDefinition<T, A> {
  return definition
}

/**
 * Type helper to infer table schema from columns definition
 */
export type InferTableSchema<Columns extends Record<string, ColumnDefinition>> = {
  [K in keyof Columns]: Columns[K]["type"] extends "INTEGER"
    ? number
    : Columns[K]["type"] extends "REAL" | "DOUBLE" | "FLOAT"
      ? number
      : Columns[K]["type"] extends "BLOB"
        ? Buffer
        : Columns[K]["type"] extends "JSON"
          ? unknown
          : string
}

/**
 * Type helper to extract action names from actions object
 */
export type ActionNames<A> = keyof A & string

/**
 * Validate that route actions exist in the actions object
 */
export type ValidateRouteActions<
  T extends Record<string, unknown>,
  A extends PluginActions<T>,
  RouteActions extends readonly (keyof A)[],
> = RouteActions

// Re-export types for convenience
export type {
  PluginActions,
  PluginActionContext,
  PluginConfig,
  PluginRoute,
  PluginFrontendConfig,
  PluginFrontendRoute,
  FrontendAction,
  FrontendLoader,
  EVENTS,
  ColumnDefinition,
}
