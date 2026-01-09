import type { ActionConfig, LoaderConfig } from "@dockstat/template-renderer"

export interface LoaderResult {
  loaderId: string
  success: boolean
  data?: unknown
  error?: string
  stateKey?: string
  dataKey?: string
  loadedAt: number
}

export interface ResolvedLoader extends LoaderConfig {
  pluginId: number
  pluginName: string
}

export interface ResolvedAction extends ActionConfig {
  pluginId: number
  pluginName: string
}

export interface PluginRouteInfo {
  pluginId: number
  pluginName: string
  fullPath: string
  path: string
  meta?: {
    title?: string
    icon?: string
    showInNav?: boolean
    navOrder?: number
  }
}

export interface PluginPageData {
  route: PluginRouteInfo | null
  template: unknown | null
  fragments: unknown[]
  loaders: ResolvedLoader[]
  actions: ResolvedAction[]
  initialData: {
    loaderResults: LoaderResult[]
    state: Record<string, unknown>
    data: Record<string, unknown>
  }
  error?: string
}
