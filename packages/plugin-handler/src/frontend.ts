/**
 * Plugin Frontend Handler
 *
 * Manages frontend templates for plugins, providing methods to:
 * - Get frontend routes from loaded plugins
 * - Parse and validate templates
 * - Resolve template fragments
 */

import type Logger from "@dockstat/logger"
import type { PluginFrontendConfig, PluginFrontendRoute } from "@dockstat/typings"
import type { Plugin } from "@dockstat/typings/types"

/**
 * Resolved frontend route with plugin context
 */

export interface ResolvedFrontendRoute extends PluginFrontendRoute {
  /** Plugin ID this route belongs to */
  pluginId: number
  /** Plugin name for display purposes */
  pluginName: string
  /** Full path including plugin prefix */
  fullPath: string
}

/**
 * Frontend routes grouped by plugin
 */
export interface PluginFrontendRoutes {
  pluginId: number
  pluginName: string
  routes: PluginFrontendRoute[]
  sharedFragments?: unknown[]
  globalState?: PluginFrontendConfig["globalState"]
}

/**
 * Options for the frontend handler
 */
export interface PluginFrontendHandlerOptions {
  /** Base path prefix for plugin routes (default: "/plugins") */
  basePathPrefix?: string
  /** Logger instance */
  logger?: Logger
}

/**
 * Plugin Frontend Handler
 *
 * Handles frontend template management for plugins
 */
export class PluginFrontendHandler {
  private basePathPrefix: string
  private logger?: Logger

  constructor(options: PluginFrontendHandlerOptions = {}) {
    this.basePathPrefix = options.basePathPrefix ?? "/p"
    this.logger = options.logger
  }

  /**
   * Get all frontend routes from loaded plugins
   */
  public getAllFrontendRoutes(loadedPlugins: Map<number, Plugin>): ResolvedFrontendRoute[] {
    const routes: ResolvedFrontendRoute[] = []

    for (const [pluginId, plugin] of loadedPlugins) {
      const frontendConfig = plugin.config?.frontend
      if (!frontendConfig?.routes) {
        continue
      }

      this.logger?.debug(`Processing frontend routes for plugin ${plugin.name} (${pluginId})`)

      for (const route of frontendConfig.routes) {
        const fullPath = this.buildFullPath(pluginId, route.path)
        routes.push({
          ...route,
          pluginId,
          pluginName: plugin.name,
          fullPath,
        })
      }
    }

    this.logger?.info(`Found ${routes.length} frontend routes across all plugins`)
    return routes
  }

  /**
   * Get frontend routes grouped by plugin
   */
  public getFrontendRoutesByPlugin(loadedPlugins: Map<number, Plugin>): PluginFrontendRoutes[] {
    const result: PluginFrontendRoutes[] = []

    for (const [pluginId, plugin] of loadedPlugins) {
      const frontendConfig = plugin.config?.frontend
      if (!frontendConfig?.routes || frontendConfig.routes.length === 0) {
        continue
      }

      result.push({
        pluginId,
        pluginName: plugin.name,
        routes: frontendConfig.routes,
        sharedFragments: frontendConfig.sharedFragments,
        globalState: frontendConfig.globalState,
      })
    }

    return result
  }

  /**
   * Get frontend configuration for a specific plugin
   */
  public getPluginFrontendConfig(
    pluginId: number,
    loadedPlugins: Map<number, Plugin>
  ): PluginFrontendConfig | null {
    const plugin = loadedPlugins.get(pluginId)
    if (!plugin) {
      this.logger?.warn(`Plugin ${pluginId} not found`)
      return null
    }

    return plugin.config?.frontend ?? null
  }

  /**
   * Get a specific frontend route by plugin ID and path
   */
  public getRoute(
    pluginId: number,
    routePath: string,
    loadedPlugins: Map<number, Plugin>
  ): ResolvedFrontendRoute | null {
    const plugin = loadedPlugins.get(pluginId)
    if (!plugin) {
      this.logger?.warn(`Plugin ${pluginId} not found`)
      return null
    }

    const frontendConfig = plugin.config?.frontend
    if (!frontendConfig?.routes) {
      this.logger?.warn(`Plugin ${pluginId} has no frontend routes`)
      return null
    }

    // Normalize path for comparison
    const normalizedPath = routePath.startsWith("/") ? routePath : `/${routePath}`

    const route = frontendConfig.routes.find((r) => {
      const rPath = r.path.startsWith("/") ? r.path : `/${r.path}`
      return rPath === normalizedPath
    })

    if (!route) {
      this.logger?.warn(`Route ${routePath} not found in plugin ${pluginId}`)
      return null
    }

    return {
      ...route,
      pluginId,
      pluginName: plugin.name,
      fullPath: this.buildFullPath(pluginId, route.path),
    }
  }

  /**
   * Get the template for a specific route
   */
  public getTemplate(
    pluginId: number,
    routePath: string,
    loadedPlugins: Map<number, Plugin>
  ): unknown | null {
    const route = this.getRoute(pluginId, routePath, loadedPlugins)
    return route?.template ?? null
  }

  /**
   * Get shared fragments for a plugin
   */
  public getSharedFragments(pluginId: number, loadedPlugins: Map<number, Plugin>): unknown[] {
    const config = this.getPluginFrontendConfig(pluginId, loadedPlugins)
    return config?.sharedFragments ?? []
  }

  /**
   * Get navigation items for plugins with frontend routes
   * Returns routes that should be shown in navigation
   */
  public getNavigationItems(loadedPlugins: Map<number, Plugin>): Array<{
    pluginId: number
    pluginName: string
    path: string
    title: string
    icon?: string
    order: number
  }> {
    const navItems: Array<{
      pluginId: number
      pluginName: string
      path: string
      title: string
      icon?: string
      order: number
    }> = []

    for (const [pluginId, plugin] of loadedPlugins) {
      const frontendConfig = plugin.config?.frontend
      if (!frontendConfig?.routes) {
        continue
      }

      for (const route of frontendConfig.routes) {
        if (route.meta?.showInNav !== false) {
          navItems.push({
            pluginId,
            pluginName: plugin.name,
            path: this.buildFullPath(pluginId, route.path),
            title: route.meta?.title ?? plugin.name,
            icon: route.meta?.icon,
            order: route.meta?.navOrder ?? 999,
          })
        }
      }
    }

    // Sort by order
    navItems.sort((a, b) => a.order - b.order)

    return navItems
  }

  /**
   * Build the full path for a plugin route
   */
  private buildFullPath(pluginId: number, routePath: string): string {
    const normalizedRoutePath = routePath.startsWith("/") ? routePath : `/${routePath}`
    return `${this.basePathPrefix}/${pluginId}${normalizedRoutePath}`
  }

  /**
   * Check if a plugin has any frontend routes
   */
  public hasFrontendRoutes(pluginId: number, loadedPlugins: Map<number, Plugin>): boolean {
    const plugin = loadedPlugins.get(pluginId)
    if (!plugin) {
      return false
    }

    const routes = plugin.config?.frontend?.routes
    return Array.isArray(routes) && routes.length > 0
  }

  /**
   * Get summary of all frontend configurations
   */
  public getSummary(loadedPlugins: Map<number, Plugin>): {
    totalRoutes: number
    pluginsWithFrontend: number
    routesByPlugin: Record<number, number>
  } {
    let totalRoutes = 0
    let pluginsWithFrontend = 0
    const routesByPlugin: Record<number, number> = {}

    for (const [pluginId, plugin] of loadedPlugins) {
      const routes = plugin.config?.frontend?.routes
      if (routes && routes.length > 0) {
        pluginsWithFrontend++
        totalRoutes += routes.length
        routesByPlugin[pluginId] = routes.length
      }
    }

    return {
      totalRoutes,
      pluginsWithFrontend,
      routesByPlugin,
    }
  }
}

export default PluginFrontendHandler
