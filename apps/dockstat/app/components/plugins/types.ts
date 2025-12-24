import type { ApiErrorResponse, ApiSuccessResponse, ApiResponse } from "@dockstat/utils"

// Re-export the centralized error types for convenience
export type { ApiErrorResponse, ApiSuccessResponse, ApiResponse }

/**
 * Plugin author information
 */
export interface PluginAuthor {
  name: string
  website?: string
  license: string
  email?: string
}

/**
 * Repository type from config
 */
export type RepoType = "local" | "http" | "github" | "gitlab" | "gitea" | "default"

/**
 * Verification policy
 */
export type VerificationPolicy = "strict" | "relaxed"

/**
 * Hash entry for a verified item
 */
export interface HashEntry {
  version: string
  hash: string
}

/**
 * Cached hashes for plugins only (stacks and themes don't need verification)
 */
export type CachedHashes = Record<string, HashEntry>

/**
 * Repository from the repositories table
 */
export interface ConfigRepository {
  id: number
  name: string
  type: RepoType
  source: string
  policy: VerificationPolicy
  verification_api: string | null
  isVerified: boolean
  hashes: CachedHashes | null
}

/**
 * Plugin metadata from the API
 */
export interface PluginMeta {
  id: number | null
  name: string
  description: string
  version: string
  repository: string
  repoType: RepoType | string
  manifest: string
  author: PluginAuthor
  tags?: string[]
}

/**
 * Installed plugin (from /plugins/all endpoint)
 */
export interface InstalledPlugin extends Omit<PluginMeta, "id"> {
  id: number
}

/**
 * Plugin with loaded status
 */
export interface PluginWithStatus extends InstalledPlugin {
  isLoaded: boolean
  isActive: boolean
}

/**
 * Security status from verification
 */
export type SecurityStatus = "safe" | "unsafe" | "unknown" | "unverified"

/**
 * Verification result from dockstore-verification API
 */
export interface VerificationApiResult {
  valid: boolean
  pluginName: string
  pluginVersion: string
  hash: string
  verified: boolean
  securityStatus: SecurityStatus
  verifiedBy?: string
  verifiedAt?: number
  notes?: string
  message: string
}

/**
 * Batch verification result from dockstore-verification API
 */
export interface BatchVerificationResult {
  results: VerificationApiResult[]
  summary: {
    total: number
    verified: number
    safe: number
    unsafe: number
    unknown: number
    allSafe: boolean
    hasUnsafe: boolean
  }
}

/**
 * Local verification status (computed from API or cache)
 */
export interface LocalVerificationStatus {
  isVerified: boolean
  securityStatus: SecurityStatus
  hash: string | null
  cachedHash: string | null
  matchesCache: boolean
  repository: string | null
  policy: VerificationPolicy | null
  message: string
  verifiedBy?: string
  verifiedAt?: number
  notes?: string
}

/**
 * Remote plugin from a repository manifest (before installation)
 */
export interface RemotePlugin {
  name: string
  description: string
  version: string
  author: PluginAuthor
  repository: string
  repoType: RepoType | string
  manifest: string
  tags?: string[]
  sourceHash?: string
  // Verification status
  verification?: LocalVerificationStatus
}

/**
 * Plugin status response from the API
 */
export interface PluginStatusResponse {
  installed_plugins: number
  types: {
    gitlab: InstalledPlugin[]
    github: InstalledPlugin[]
    http: InstalledPlugin[]
  }
  repos: string[]
  loaded_plugins: InstalledPlugin[]
}

/**
 * Action response types
 */
export interface ActionSuccess<T = unknown> {
  success: true
  data?: T
  message?: string
}

export interface ActionError {
  success: false
  error: string
  message?: string
}

export type ActionResponse<T = unknown> = ActionSuccess<T> | ActionError

/**
 * Helper type guard to check if an action response is an error
 */
export function isActionError(response: ActionResponse): response is ActionError {
  return response.success === false
}

/**
 * Helper type guard to check if an action response is successful
 */
export function isActionSuccess<T>(response: ActionResponse<T>): response is ActionSuccess<T> {
  return response.success === true
}

// ==================== Plugin Detail Types ====================

/**
 * Plugin API route definition
 */
export interface PluginApiRoute {
  path: string
  method: "GET" | "POST"
  actions: string[]
}

/**
 * Frontend loader configuration
 */
export interface FrontendLoader {
  id: string
  apiRoute: string
  method?: "GET" | "POST"
  body?: unknown
  stateKey?: string
  dataKey?: string
  cache?: {
    ttl?: number
    key?: string
  }
  runOnNavigate?: boolean
  polling?: {
    interval: number
    enabled?: boolean | string
  }
}

/**
 * Frontend action success handler
 */
export interface FrontendActionSuccessHandler {
  setState?: Record<string, string | unknown>
  notify?: {
    message: string
    type?: "success" | "info"
  }
  triggerAction?: string
  navigate?: string
}

/**
 * Frontend action error handler
 */
export interface FrontendActionErrorHandler {
  setState?: Record<string, unknown>
  notify?: {
    message: string
    type?: "error" | "warning"
  }
  triggerAction?: string
}

/**
 * Frontend action configuration
 */
export interface FrontendAction {
  id: string
  type: "setState" | "navigate" | "api" | "reload" | "custom"
  stateUpdates?: Record<string, unknown>
  path?: string
  apiRoute?: string
  method?: "GET" | "POST"
  body?: unknown
  onSuccess?: FrontendActionSuccessHandler
  onError?: FrontendActionErrorHandler
  loaderIds?: string[]
  handler?: string
  showLoading?: boolean
  confirm?: {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
  }
  debounce?: number
}

/**
 * Frontend route metadata
 */
export interface FrontendRouteMeta {
  title?: string
  icon?: string
  showInNav?: boolean
  navOrder?: number
  [key: string]: unknown
}

/**
 * Frontend route configuration
 */
export interface PluginFrontendRoute {
  path: string
  template: unknown
  meta?: FrontendRouteMeta
  loaders?: FrontendLoader[]
  actions?: FrontendAction[]
}

/**
 * Frontend configuration summary
 */
export interface PluginFrontendConfig {
  routes?: PluginFrontendRoute[]
  sharedFragments?: unknown[]
  globalState?: {
    initial: Record<string, unknown>
    computed?: Record<string, string>
  }
  globalActions?: FrontendAction[]
  globalLoaders?: FrontendLoader[]
}

/**
 * Plugin hook handler info
 */
export interface PluginHook {
  eventName: string
  handler: string
  priority?: number
}

/**
 * Complete plugin details for modal display
 */
export interface PluginDetails {
  // Basic info
  id: number
  name: string
  description: string
  version: string
  author: PluginAuthor
  repository: string
  repoType: RepoType | string
  manifest: string
  tags?: string[]

  // Status
  isLoaded: boolean
  isActive: boolean

  // Routes and configuration
  apiRoutes: PluginApiRoute[]
  frontendRoutes: PluginFrontendRoute[]
  frontendActions: FrontendAction[]
  frontendLoaders: FrontendLoader[]
  hooks: PluginHook[]

  // Verification
  verification: LocalVerificationStatus | null
}

/**
 * Plugin routes response from API
 */
export interface PluginRoutesResponse {
  plugin: string
  routes: string[]
}

/**
 * Frontend routes by plugin response
 */
export interface FrontendRoutesByPluginResponse {
  pluginId: number
  pluginName: string
  routes: PluginFrontendRoute[]
}

/**
 * Frontend summary response
 */
export interface FrontendSummaryResponse {
  totalPlugins: number
  totalRoutes: number
  totalActions: number
  totalLoaders: number
  plugins: Array<{
    pluginId: number
    pluginName: string
    routeCount: number
    actionCount: number
    loaderCount: number
  }>
}

/**
 * Hook handlers response
 */
export interface HookHandlersResponse {
  pluginId: number
  hooks: Map<string, unknown>
}

// ==================== Component Props ====================

/**
 * Props for PluginStatusBar component
 */
export interface PluginStatusBarProps {
  totalPlugins: number
  loadedPlugins: number
  verifiedPlugins: number
  safePlugins: number
  unsafePlugins: number
  totalRepositories: number
}

/**
 * Props for PluginCard component
 */
export interface PluginCardProps {
  plugin: InstalledPlugin
  isLoaded?: boolean
  verification?: LocalVerificationStatus | null
  onActivate?: (pluginId: number) => void
  onDeactivate?: (pluginId: number) => void
  onDelete?: (pluginId: number) => void
  onClick?: (pluginId: number) => void
}

/**
 * Props for PluginsList component
 */
export interface PluginsListProps {
  plugins: InstalledPlugin[]
  loadedPluginIds: number[]
  verifications?: Map<number, LocalVerificationStatus>
}

/**
 * Props for RepositoryCard component
 */
export interface RepositoryCardProps {
  repository: ConfigRepository
  onSync?: (repoId: number) => void
  onDelete?: (repoId: number) => void
  onToggle?: (repoId: number) => void
  onEdit?: (repoId: number) => void
  pluginCount?: number
}

/**
 * Props for RepositoriesList component
 */
export interface RepositoriesListProps {
  repositories: ConfigRepository[]
  pluginCountByRepo?: Record<string, number>
}

/**
 * Props for RemotePluginCard component
 */
export interface RemotePluginCardProps {
  plugin: RemotePlugin
  isInstalled?: boolean
  onInstall?: (plugin: RemotePlugin) => void
}

/**
 * Props for AddRepositoryForm component
 */
export interface AddRepositoryFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * Props for EditRepositoryForm component
 */
export interface EditRepositoryFormProps {
  repository: ConfigRepository
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * Props for DeletePluginButton component
 */
export interface DeletePluginButtonProps {
  pluginId: number
  pluginName: string
  size?: "sm" | "md" | "lg"
}

/**
 * Props for ActivatePluginButton component
 */
export interface ActivatePluginButtonProps {
  pluginId: number
  isActive: boolean
  size?: "sm" | "md" | "lg"
}

/**
 * Props for PluginDetailModal component
 */
export interface PluginDetailModalProps {
  open: boolean
  onClose: () => void
  plugin: InstalledPlugin | null
  isLoaded: boolean
  verification: LocalVerificationStatus | null
}

/**
 * Loader data for plugins page
 */
export interface PluginsLoaderData {
  plugins: InstalledPlugin[]
  loadedPluginIds: number[]
  repositories: ConfigRepository[]
  verifications: Record<number, LocalVerificationStatus>
  stats: {
    totalPlugins: number
    loadedPlugins: number
    verifiedPlugins: number
    safePlugins: number
    unsafePlugins: number
    totalRepositories: number
  }
}

// ==================== Verification API Types ====================

/**
 * Request body for verification compare endpoint
 */
export interface VerificationCompareRequest {
  pluginName: string
  pluginHash: string
  pluginVersion: string
}

/**
 * Request body for batch verification compare endpoint
 */
export interface BatchVerificationCompareRequest {
  plugins: VerificationCompareRequest[]
}

/**
 * Configuration for verification API
 */
export interface VerificationApiConfig {
  baseUrl: string
  timeout?: number
}
