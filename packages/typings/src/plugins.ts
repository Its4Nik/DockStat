export * from "./plugin-base"

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
 * Frontend data loader configuration
 * Defines data that should be loaded when a frontend route is accessed
 */
export interface FrontendLoader {
  /** Unique identifier for this loader */
  id: string
  /** Plugin API route to call for loading data */
  apiRoute: string
  /** HTTP method to use (defaults to GET) */
  method?: "GET" | "POST"
  /** Request body for POST requests - can be static data or binding expressions */
  body?: unknown
  /** State key where the loaded data will be stored */
  stateKey?: string
  /** Data key where the loaded data will be stored (passed to template as data) */
  dataKey?: string
  /** Cache configuration for the loader */
  cache?: {
    /** Time to live in milliseconds */
    ttl?: number
    /** Custom cache key expression */
    key?: string
  }
  /** Whether this loader should run on every navigation (default: true) */
  runOnNavigate?: boolean
  /** Whether this loader should run periodically */
  polling?: {
    /** Polling interval in milliseconds */
    interval: number
    /** Whether polling is enabled (can be bound to state) */
    enabled?: boolean | string
  }
}

/**
 * Success handler configuration for frontend actions
 */
export interface FrontendActionSuccessHandler {
  /** State updates to apply on success - maps result paths to state keys */
  setState?: Record<string, string | unknown>
  /** Notification to show on success */
  notify?: {
    message: string
    type?: "success" | "info"
  }
  /** Action to trigger on success */
  triggerAction?: string
  /** Navigate to a path on success */
  navigate?: string
}

/**
 * Error handler configuration for frontend actions
 */
export interface FrontendActionErrorHandler {
  /** State updates to apply on error */
  setState?: Record<string, unknown>
  /** Notification to show on error */
  notify?: {
    message: string
    type?: "error" | "warning"
  }
  /** Action to trigger on error */
  triggerAction?: string
}

/**
 * Frontend action configuration
 * Defines actions that can be triggered from templates
 */
export interface FrontendAction {
  /** Unique identifier for this action */
  id: string
  /** Type of action */
  type: "setState" | "navigate" | "api" | "reload" | "custom"

  // ---- setState type ----
  /** State updates for setState type */
  stateUpdates?: Record<string, unknown>

  // ---- navigate type ----
  /** Navigation path for navigate type */
  path?: string

  // ---- api type ----
  /** Plugin API route to call for api type */
  apiRoute?: string
  /** HTTP method for API call (defaults to POST) */
  method?: "GET" | "POST"
  /** Request body for API call - can be static data or use {{state.key}} bindings */
  body?: unknown
  /** Handler for successful API response */
  onSuccess?: FrontendActionSuccessHandler
  /** Handler for API error */
  onError?: FrontendActionErrorHandler

  // ---- reload type ----
  /** Loader IDs to reload for reload type (reloads all if not specified) */
  loaderIds?: string[]

  // ---- custom type ----
  /** Custom handler identifier for custom type */
  handler?: string

  // ---- Common options ----
  /** Whether to show a loading indicator while executing */
  showLoading?: boolean
  /** Confirmation dialog before executing */
  confirm?: {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
  }
  /** Debounce delay in milliseconds */
  debounce?: number
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
  /** Data loaders for this route */
  loaders?: FrontendLoader[]
  /** Actions available for this route */
  actions?: FrontendAction[]
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
  /** Global actions available to all routes */
  globalActions?: FrontendAction[]
  /** Global loaders that run for all routes */
  globalLoaders?: FrontendLoader[]
}

/**
 * Result of executing a frontend loader
 */
export interface FrontendLoaderResult {
  /** Loader ID */
  loaderId: string
  /** Whether the loader succeeded */
  success: boolean
  /** Loaded data (on success) */
  data?: unknown
  /** Error message (on failure) */
  error?: string
  /** State key where data should be stored */
  stateKey?: string
  /** Data key where data should be stored */
  dataKey?: string
  /** Timestamp when the data was loaded */
  loadedAt: number
}

/**
 * Result of executing a frontend action
 */
export interface FrontendActionResult {
  /** Action ID */
  actionId: string
  /** Whether the action succeeded */
  success: boolean
  /** Result data (on success) */
  data?: unknown
  /** Error message (on failure) */
  error?: string
  /** Timestamp when the action was executed */
  executedAt: number
}

/* PluginConfig defines the complete configuration for a plugin */
export type PluginConfig<T extends Record<string, unknown>, A extends PluginActions<T>> = {
  table?: {
    name: string
    parser: Parser<T>
    columns: Record<string, unknown>
  }
  apiRoutes?: Record<string, PluginRoute<T, A>>
  actions?: A
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
