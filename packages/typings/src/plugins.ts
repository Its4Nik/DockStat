type PluginMeta = {
  name: string,
  license: string,
  repository: string,
  path: string,
  version: string,
  website?: string
}

export type PluginTable = {
  id?: number
  meta: PluginMeta,
  plugin: {
    component?: string
    backendConfig?: PluginAPI
  }
}

export type PluginGuard = {
  allowedAPIs: string[]
}

export type PluginAPI = {
  routes?: Array<{ path: string, method: "GET" | "POST", params?: string[] }>
  onGet?: unknown
  onPost?: unknown
  table?: string
  columns?: string[]
}
