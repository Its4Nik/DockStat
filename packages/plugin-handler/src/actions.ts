/**
 * Frontend Actions Handler
 *
 * Handles execution of frontend loaders and actions by calling plugin API routes.
 * This enables templates to fetch data and trigger backend actions.
 */

import type Logger from "@dockstat/logger"
import type {
  FrontendAction,
  FrontendActionResult,
  FrontendLoader,
  FrontendLoaderResult,
} from "@dockstat/typings"
import type { Plugin } from "@dockstat/typings/types"

const PORT = 3000

/**
 * Options for the frontend actions handler
 */
export interface FrontendActionsHandlerOptions {
  /** Logger instance */
  logger?: Logger
  /** Base URL for API calls (used for internal route handling) */
  apiBaseUrl?: string
}

/**
 * Context for executing loaders and actions
 */
export interface ExecutionContext {
  /** Plugin ID */
  pluginId: number
  /** Current state values */
  state?: Record<string, unknown>
  /** Additional payload data */
  payload?: unknown
}

/**
 * Resolved loader with plugin context
 */
export interface ResolvedLoader extends FrontendLoader {
  pluginId: number
  pluginName: string
}

/**
 * Resolved action with plugin context
 */
export interface ResolvedAction extends FrontendAction {
  pluginId: number
  pluginName: string
}

/**
 * Frontend Actions Handler
 *
 * Manages execution of frontend loaders and actions
 */
export class FrontendActionsHandler {
  private logger?: Logger

  constructor(options: FrontendActionsHandlerOptions = {}) {
    this.logger = options.logger
  }

  /**
   * Get all loaders for a plugin route
   */
  public getRouteLoaders(
    pluginId: number,
    routePath: string,
    loadedPlugins: Map<number, Plugin>
  ): ResolvedLoader[] {
    const plugin = loadedPlugins.get(pluginId)
    if (!plugin) {
      this.logger?.warn(`Plugin ${pluginId} not found`)
      return []
    }

    const frontendConfig = plugin.config?.frontend
    if (!frontendConfig) {
      return []
    }

    // Normalize path for comparison
    const normalizedPath = routePath.startsWith("/") ? routePath : `/${routePath}`

    // Find the route
    const route = frontendConfig.routes?.find((r) => {
      const rPath = r.path.startsWith("/") ? r.path : `/${r.path}`
      return rPath === normalizedPath
    })

    const loaders: ResolvedLoader[] = []

    // Add global loaders first
    if (frontendConfig.globalLoaders) {
      for (const loader of frontendConfig.globalLoaders) {
        loaders.push({
          ...loader,
          pluginId,
          pluginName: plugin.name,
        })
      }
    }

    // Add route-specific loaders
    if (route?.loaders) {
      for (const loader of route.loaders) {
        loaders.push({
          ...loader,
          pluginId,
          pluginName: plugin.name,
        })
      }
    }

    this.logger?.debug(`Found ${loaders.length} loaders for plugin ${pluginId} route ${routePath}`)
    return loaders
  }

  /**
   * Get all actions for a plugin route
   */
  public getRouteActions(
    pluginId: number,
    routePath: string,
    loadedPlugins: Map<number, Plugin>
  ): ResolvedAction[] {
    const plugin = loadedPlugins.get(pluginId)
    if (!plugin) {
      this.logger?.warn(`Plugin ${pluginId} not found`)
      return []
    }

    const frontendConfig = plugin.config?.frontend
    if (!frontendConfig) {
      return []
    }

    // Normalize path for comparison
    const normalizedPath = routePath.startsWith("/") ? routePath : `/${routePath}`

    // Find the route
    const route = frontendConfig.routes?.find((r) => {
      const rPath = r.path.startsWith("/") ? r.path : `/${r.path}`
      return rPath === normalizedPath
    })

    const actions: ResolvedAction[] = []

    // Add global actions first
    if (frontendConfig.globalActions) {
      for (const action of frontendConfig.globalActions) {
        actions.push({
          ...action,
          pluginId,
          pluginName: plugin.name,
        })
      }
    }

    // Add route-specific actions
    if (route?.actions) {
      for (const action of route.actions) {
        actions.push({
          ...action,
          pluginId,
          pluginName: plugin.name,
        })
      }
    }

    // Also include template actions if the template defines them
    const template = route?.template as {
      actions?: FrontendAction[]
    } | null

    if (template?.actions) {
      for (const action of template.actions) {
        // Avoid duplicates by checking ID
        if (!actions.some((a) => a.id === action.id)) {
          actions.push({
            ...action,
            pluginId,
            pluginName: plugin.name,
          })
        }
      }
    }

    this.logger?.debug(`Found ${actions.length} actions for plugin ${pluginId} route ${routePath}`)
    return actions
  }

  /**
   * Execute a single loader by calling the plugin API route
   */
  public async executeLoader(
    loader: ResolvedLoader,
    handleRoute: (pluginId: number, path: string, request: Request) => Promise<unknown>,
    context: ExecutionContext
  ): Promise<FrontendLoaderResult> {
    const startTime = Date.now()

    try {
      this.logger?.debug(
        `Executing loader ${loader.id} for plugin ${loader.pluginId} - route: ${loader.apiRoute}`
      )

      // Resolve body with state bindings if needed
      const resolvedBody = this.resolveBindings(loader.body, context.state)

      // Create a mock request for the route handler
      const method = loader.method ?? "GET"
      const request = new Request(`http://localhost:${PORT}/${loader.apiRoute}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: method === "POST" && resolvedBody ? JSON.stringify(resolvedBody) : undefined,
      })

      // Call the plugin route handler
      const result = await handleRoute(loader.pluginId, loader.apiRoute, request)

      this.logger?.info(`Loader ${loader.id} completed successfully in ${Date.now() - startTime}ms`)

      return {
        loaderId: loader.id,
        success: true,
        data: result,
        stateKey: loader.stateKey,
        dataKey: loader.dataKey,
        loadedAt: Date.now(),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger?.error(`Loader ${loader.id} failed: ${errorMessage}`)

      return {
        loaderId: loader.id,
        success: false,
        error: errorMessage,
        stateKey: loader.stateKey,
        dataKey: loader.dataKey,
        loadedAt: Date.now(),
      }
    }
  }

  /**
   * Execute multiple loaders in parallel
   */
  public async executeLoaders(
    loaders: ResolvedLoader[],
    handleRoute: (pluginId: number, path: string, request: Request) => Promise<unknown>,
    context: ExecutionContext
  ): Promise<FrontendLoaderResult[]> {
    this.logger?.info(`Executing ${loaders.length} loaders`)

    const results = await Promise.all(
      loaders.map((loader) => this.executeLoader(loader, handleRoute, context))
    )

    const successCount = results.filter((r) => r.success).length
    this.logger?.info(
      `Completed ${loaders.length} loaders: ${successCount} succeeded, ${loaders.length - successCount} failed`
    )

    return results
  }

  /**
   * Execute a single action by calling the plugin API route
   */
  public async executeAction(
    action: ResolvedAction,
    handleRoute: (pluginId: number, path: string, request: Request) => Promise<unknown>,
    context: ExecutionContext
  ): Promise<FrontendActionResult> {
    const startTime = Date.now()

    try {
      this.logger?.debug(
        `Executing action ${action.id} (type: ${action.type}) for plugin ${action.pluginId}`
      )

      // Handle different action types
      switch (action.type) {
        case "api": {
          if (!action.apiRoute) {
            throw new Error(`API action ${action.id} is missing apiRoute`)
          }

          // Resolve body with state bindings and payload
          const resolvedBody = this.resolveBindings(action.body, {
            ...context.state,
            payload: context.payload,
          })

          // Create request for the API route
          const method = action.method ?? "POST"
          const request = new Request(`http://localhost:${PORT}/${action.apiRoute}`, {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: method === "POST" && resolvedBody ? JSON.stringify(resolvedBody) : undefined,
          })

          // Call the plugin route handler
          const result = await handleRoute(action.pluginId, action.apiRoute, request)

          this.logger?.info(
            `API action ${action.id} completed successfully in ${Date.now() - startTime}ms`
          )

          return {
            actionId: action.id,
            success: true,
            data: result,
            executedAt: Date.now(),
          }
        }

        case "setState":
          // setState actions are handled on the frontend
          return {
            actionId: action.id,
            success: true,
            data: { stateUpdates: action.stateUpdates },
            executedAt: Date.now(),
          }

        case "navigate":
          // navigate actions are handled on the frontend
          return {
            actionId: action.id,
            success: true,
            data: { path: action.path },
            executedAt: Date.now(),
          }

        case "reload":
          // reload actions are handled on the frontend
          return {
            actionId: action.id,
            success: true,
            data: { loaderIds: action.loaderIds },
            executedAt: Date.now(),
          }

        case "custom":
          // custom actions need a handler on the frontend
          return {
            actionId: action.id,
            success: true,
            data: { handler: action.handler },
            executedAt: Date.now(),
          }

        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger?.error(`Action ${action.id} failed: ${errorMessage}`)

      return {
        actionId: action.id,
        success: false,
        error: errorMessage,
        executedAt: Date.now(),
      }
    }
  }

  /**
   * Build initial state and data from loader results
   */
  public buildInitialDataFromLoaderResults(results: FrontendLoaderResult[]): {
    state: Record<string, unknown>
    data: Record<string, unknown>
  } {
    const state: Record<string, unknown> = {}
    const data: Record<string, unknown> = {}

    for (const result of results) {
      if (!result.success) {
        continue
      }

      if (result.stateKey) {
        state[result.stateKey] = result.data
      }

      if (result.dataKey) {
        data[result.dataKey] = result.data
      }

      // If neither key is specified, use the loader ID as the data key
      if (!result.stateKey && !result.dataKey) {
        data[result.loaderId] = result.data
      }
    }

    return { state, data }
  }

  /**
   * Resolve binding expressions in a value
   * Supports {{state.key}} and {{payload.key}} syntax
   */
  private resolveBindings(value: unknown, context?: Record<string, unknown>): unknown {
    if (!context) {
      return value
    }

    if (typeof value === "string") {
      // Check for binding pattern {{path.to.value}}
      const bindingPattern = /\{\{([^}]+)\}\}/g
      let result = value
      let match: RegExpExecArray | null = bindingPattern.exec(value)

      while (match !== null && match[1] !== undefined) {
        const path = match[1].trim()
        const resolvedValue = this.getValueByPath(context, path)

        // If the entire string is a single binding, return the resolved value directly
        if (match[0] === value) {
          return resolvedValue
        }

        // Otherwise, replace the binding in the string
        result = result.replace(match[0], String(resolvedValue ?? ""))
        match = bindingPattern.exec(value)
      }

      return result
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveBindings(item, context))
    }

    if (typeof value === "object" && value !== null) {
      const resolved: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveBindings(val, context)
      }
      return resolved
    }

    return value
  }

  /**
   * Get a value from a nested object using a dot-notation path
   */
  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".")
    let current: unknown = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      if (typeof current !== "object") {
        return undefined
      }
      current = (current as Record<string, unknown>)[part]
    }

    return current
  }
}

export default FrontendActionsHandler
