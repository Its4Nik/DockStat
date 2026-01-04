/**
 * Plugin Page Route
 *
 * Renders plugin frontend pages using template renderer.
 * Supports data loading via loaders and action execution via API.
 * Route: /p/:pluginId/*
 */

import {
  type ActionConfig,
  type LoaderConfig,
  type PageTemplate,
  parseTemplate,
  type TemplateFragment,
  TemplateRenderer,
} from "@dockstat/template-renderer"
import { Card } from "@dockstat/ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLoaderData, useNavigate, useParams } from "react-router"
import { executePluginAction, executePluginLoader } from "@/lib/actions/plugins"
import { fetchPluginTemplate } from "@/lib/queries/plugins"
import type { Route } from "./+types/plugin-page"

/**
 * Loader result from the API
 */
interface LoaderResult {
  loaderId: string
  success: boolean
  data?: unknown
  error?: string
  stateKey?: string
  dataKey?: string
  loadedAt: number
}

/**
 * Resolved loader with plugin context
 */
interface ResolvedLoader extends LoaderConfig {
  pluginId: number
  pluginName: string
}

/**
 * Resolved action with plugin context
 */
interface ResolvedAction extends ActionConfig {
  pluginId: number
  pluginName: string
}

interface PluginPageLoaderData {
  route: {
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
  } | null
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
  pluginId: number
  routePath: string
}

export async function loader({ params }: Route.LoaderArgs): Promise<PluginPageLoaderData> {
  const pluginId = Number(params.pluginId)
  const routePath = params["*"] || ""

  if (Number.isNaN(pluginId)) {
    return {
      route: null,
      template: null,
      fragments: [],
      loaders: [],
      actions: [],
      initialData: { loaderResults: [], state: {}, data: {} },
      error: "Invalid plugin ID",
      pluginId: 0,
      routePath,
    }
  }

  try {
    const response = await fetchPluginTemplate(
      { signal: new AbortController().signal },
      pluginId,
      routePath
    )

    const responseData = response as {
      route?: PluginPageLoaderData["route"]
      template?: unknown
      fragments?: unknown[]
      loaders?: ResolvedLoader[]
      actions?: ResolvedAction[]
      initialData?: {
        loaderResults: LoaderResult[]
        state: Record<string, unknown>
        data: Record<string, unknown>
      }
      error?: string
    }

    if (responseData.error) {
      return {
        route: null,
        template: null,
        fragments: [],
        loaders: [],
        actions: [],
        initialData: { loaderResults: [], state: {}, data: {} },
        error: responseData.error,
        pluginId,
        routePath,
      }
    }

    return {
      route: responseData.route || null,
      template: responseData.template || null,
      fragments: responseData.fragments || [],
      loaders: responseData.loaders || [],
      actions: responseData.actions || [],
      initialData: responseData.initialData || { loaderResults: [], state: {}, data: {} },
      pluginId,
      routePath,
    }
  } catch (error) {
    return {
      route: null,
      template: null,
      fragments: [],
      loaders: [],
      actions: [],
      initialData: { loaderResults: [], state: {}, data: {} },
      error: error instanceof Error ? error.message : "Unknown error occurred",
      pluginId,
      routePath,
    }
  }
}

export function meta({ data }: Route.MetaArgs) {
  const loaderData = data as PluginPageLoaderData | undefined
  if (loaderData?.route?.meta?.title) {
    return [
      { title: `${loaderData.route.meta.title} | DockStat` },
      {
        name: "description",
        content: `${loaderData.route.pluginName} - ${loaderData.route.meta.title}`,
      },
    ]
  }

  if (loaderData?.route?.pluginName) {
    return [
      { title: `${loaderData.route.pluginName} | DockStat` },
      { name: "description", content: `Plugin page for ${loaderData.route.pluginName}` },
    ]
  }

  return [{ title: "Plugin Page | DockStat" }, { name: "description", content: "Plugin page" }]
}

/**
 * Helper function to get a value from a nested object using dot notation
 */
function getValueByPath(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined

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

export default function PluginPage() {
  const data = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const params = useParams()

  // Track registered custom handlers
  const customHandlersRef = useRef<Map<string, (payload?: unknown) => void | Promise<void>>>(
    new Map()
  )

  // Parse the template
  const parsedTemplate = useMemo(() => {
    if (!data.template) return null

    try {
      // If template is already an object, use it directly
      if (typeof data.template === "object" && data.template !== null) {
        return data.template as PageTemplate
      }

      // If template is a string (JSON/YAML), parse it
      if (typeof data.template === "string") {
        const result = parseTemplate(data.template)
        return result.data
      }

      return null
    } catch (error) {
      console.error("Failed to parse template:", error)
      return null
    }
  }, [data.template])

  // Parse fragments
  const parsedFragments = useMemo(() => {
    if (!data.fragments || data.fragments.length === 0) return {}

    const fragmentsMap: Record<string, TemplateFragment> = {}

    for (const fragment of data.fragments) {
      try {
        if (typeof fragment === "object" && fragment !== null && "id" in fragment) {
          const f = fragment as TemplateFragment
          fragmentsMap[f.id] = f
        }
      } catch (error) {
        console.error("Failed to parse fragment:", error)
      }
    }

    return fragmentsMap
  }, [data.fragments])

  // Template state management - merge template initial state with loaded state
  const [state, setState] = useState<Record<string, unknown>>(() => ({
    ...parsedTemplate?.state?.initial,
    ...data.initialData.state,
  }))

  // External data from loaders
  const [externalData, setExternalData] = useState<Record<string, unknown>>(data.initialData.data)

  // Update state when initial data changes (e.g., after revalidation)
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      ...data.initialData.state,
    }))
    setExternalData(data.initialData.data)
  }, [data.initialData])

  const handleStateChange = useCallback((updates: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Navigation handler
   */
  const handleNavigate = useCallback(
    (path: string) => {
      // Handle relative paths within the plugin
      if (path.startsWith("./") || !path.startsWith("/")) {
        const basePath = `/p/${params.pluginId}`
        const resolvedPath = path.startsWith("./") ? path.slice(2) : path
        navigate(`${basePath}/${resolvedPath}`)
      } else if (path.startsWith("/p/")) {
        // Absolute plugin path
        navigate(path)
      } else {
        // Absolute app path
        navigate(path)
      }
    },
    [navigate, params.pluginId]
  )

  /**
   * Execute a specific loader by ID using the action function
   */
  const executeLoader = useCallback(
    async (loaderId: string): Promise<LoaderResult | null> => {
      if (!data.route) return null

      try {
        const response = await executePluginLoader({
          pluginId: String(data.route.pluginId),
          loaderId,
          path: data.routePath,
          state,
        })

        const result = response as {
          result?: LoaderResult
        }

        if (result.result) {
          const loaderResult = result.result

          // Update state/data based on the result
          if (loaderResult.success) {
            if (loaderResult.stateKey) {
              setState((prev) => ({
                ...prev,
                [loaderResult.stateKey as string]: loaderResult.data,
              }))
            }
            if (loaderResult.dataKey) {
              setExternalData((prev) => ({
                ...prev,
                [loaderResult.dataKey as string]: loaderResult.data,
              }))
            }
            if (!loaderResult.stateKey && !loaderResult.dataKey) {
              setExternalData((prev) => ({ ...prev, [loaderId]: loaderResult.data }))
            }
          }

          return loaderResult
        }

        return null
      } catch (error) {
        console.error(`Failed to execute loader ${loaderId}:`, error)
        return null
      }
    },
    [data.route, data.routePath, state]
  )

  /**
   * Reload all loaders or specific loaders by ID
   */
  const reloadLoaders = useCallback(
    async (loaderIds?: string[]) => {
      const loadersToReload = loaderIds || data.loaders.map((l) => l.id)
      await Promise.all(loadersToReload.map((id) => executeLoader(id)))
    },
    [data.loaders, executeLoader]
  )

  /**
   * Execute an API action using the action function
   */
  const executeApiAction = useCallback(
    async (action: ResolvedAction, payload?: unknown) => {
      if (!data.route) return null

      try {
        const response = await executePluginAction({
          pluginId: String(data.route.pluginId),
          actionId: action.id,
          path: data.routePath,
          state,
          payload,
        })

        const result = response as {
          result?: {
            actionId: string
            success: boolean
            data?: unknown
            error?: string
            executedAt: number
          }
        }

        if (result.result) {
          const actionResult = result.result

          if (actionResult.success && action.onSuccess) {
            // Handle success actions
            if (action.onSuccess.setState) {
              const stateUpdates: Record<string, unknown> = {}
              for (const [key, value] of Object.entries(action.onSuccess.setState)) {
                if (typeof value === "string" && value.startsWith("result.")) {
                  // Map result path to state key
                  const path = value.slice(7) // Remove "result."
                  stateUpdates[key] = getValueByPath(
                    actionResult.data as Record<string, unknown>,
                    path
                  )
                } else {
                  stateUpdates[key] = value
                }
              }
              handleStateChange(stateUpdates)
            }

            if (action.onSuccess.navigate) {
              handleNavigate(action.onSuccess.navigate)
            }

            if (action.onSuccess.notify) {
              // TODO: Implement notification system
              console.log(`[${action.onSuccess.notify.type}] ${action.onSuccess.notify.message}`)
            }
          } else if (!actionResult.success && action.onError) {
            // Handle error actions
            if (action.onError.setState) {
              handleStateChange(action.onError.setState)
            }

            if (action.onError.notify) {
              console.error(`[${action.onError.notify.type}] ${action.onError.notify.message}`)
            }
          }

          return actionResult
        }

        return null
      } catch (error) {
        console.error(`Failed to execute action ${action.id}:`, error)

        if (action.onError) {
          if (action.onError.setState) {
            handleStateChange(action.onError.setState)
          }
          if (action.onError.notify) {
            console.error(`[${action.onError.notify.type}] ${action.onError.notify.message}`)
          }
        }

        return null
      }
    },
    [data.route, data.routePath, state, handleStateChange, handleNavigate]
  )

  /**
   * Main action handler - handles all action types
   */
  const handleAction = useCallback(
    async (actionId: string, payload?: unknown) => {
      console.log(`Plugin action triggered: ${actionId}`, payload)

      // Find the action definition
      const action = data.actions.find((a) => a.id === actionId)

      // Also check template actions
      const templateAction = parsedTemplate?.actions?.find((a) => a.id === actionId)

      const actionDef = action || templateAction

      if (!actionDef) {
        // Check for custom handler
        const customHandler = customHandlersRef.current.get(actionId)
        if (customHandler) {
          await customHandler(payload)
          return
        }

        console.warn(`Action not found: ${actionId}`)
        return
      }

      // Handle confirmation if required
      if (actionDef.confirm) {
        const confirmed = window.confirm(
          actionDef.confirm.message || `Are you sure you want to perform this action?`
        )
        if (!confirmed) return
      }

      switch (actionDef.type) {
        case "setState":
          if (actionDef.stateUpdates) {
            handleStateChange(actionDef.stateUpdates)
          }
          break

        case "navigate":
          if (actionDef.path) {
            handleNavigate(actionDef.path)
          }
          break

        case "api":
          if (action) {
            await executeApiAction(action as ResolvedAction, payload)
          }
          break

        case "reload":
          await reloadLoaders(actionDef.loaderIds)
          break

        case "custom": {
          const customHandler = customHandlersRef.current.get(actionDef.handler || actionId)
          if (customHandler) {
            await customHandler(payload)
          } else {
            console.warn(`Custom handler not found: ${actionDef.handler || actionId}`)
          }
          break
        }

        default:
          console.warn(`Unknown action type: ${actionDef.type}`)
      }
    },
    [
      data.actions,
      parsedTemplate,
      handleStateChange,
      handleNavigate,
      executeApiAction,
      reloadLoaders,
    ]
  )

  // Set up polling for loaders that have polling enabled
  useEffect(() => {
    const pollingIntervals: ReturnType<typeof setInterval>[] = []

    for (const loader of data.loaders) {
      if (loader.polling?.enabled && loader.polling.interval > 0) {
        const enabled =
          typeof loader.polling.enabled === "string"
            ? Boolean(getValueByPath(state, loader.polling.enabled))
            : loader.polling.enabled

        if (enabled) {
          const interval = setInterval(() => {
            executeLoader(loader.id)
          }, loader.polling.interval)
          pollingIntervals.push(interval)
        }
      }
    }

    return () => {
      for (const interval of pollingIntervals) {
        clearInterval(interval)
      }
    }
  }, [data.loaders, state, executeLoader])

  // Error state
  if (data.error) {
    return (
      <div className="w-[95vw] mx-auto mt-8">
        <Card variant="elevated" size="md" className="text-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-primary-text">Plugin Page Error</h1>
            <p className="text-secondary-text">{data.error}</p>
            <div className="text-sm text-secondary-text mt-4">
              <p>Plugin ID: {data.pluginId}</p>
              <p>Route: /{data.routePath}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80 transition-colors"
            >
              Go Back
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // No route found
  if (!data.route) {
    return (
      <div className="w-[95vw] mx-auto mt-8">
        <Card variant="elevated" size="md" className="text-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="text-6xl">🔍</div>
            <h1 className="text-2xl font-bold text-primary-text">Page Not Found</h1>
            <p className="text-secondary-text">The requested plugin page could not be found.</p>
            <div className="text-sm text-secondary-text mt-4">
              <p>Plugin ID: {data.pluginId}</p>
              <p>Route: /{data.routePath}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80 transition-colors"
            >
              Go Home
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // No template
  if (!parsedTemplate) {
    return (
      <div className="w-[95vw] mx-auto mt-8">
        <Card variant="elevated" size="md" className="text-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="text-6xl">📄</div>
            <h1 className="text-2xl font-bold text-primary-text">No Template</h1>
            <p className="text-secondary-text">
              This plugin page doesn't have a valid template configured.
            </p>
            <div className="text-sm text-secondary-text mt-4">
              <p>Plugin: {data.route.pluginName}</p>
              <p>Route: {data.route.path}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80 transition-colors"
            >
              Go Back
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // Render the template
  return (
    <div className="w-[95vw] mx-auto mt-4">
      {data.route.meta?.title && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-primary-text">{data.route.meta.title}</h1>
          <p className="text-sm text-secondary-text">{data.route.pluginName}</p>
        </div>
      )}

      <TemplateRenderer
        template={parsedTemplate}
        state={state}
        data={externalData}
        onStateChange={handleStateChange}
        onAction={handleAction}
        onNavigate={handleNavigate}
        fragments={parsedFragments}
        pluginContext={{
          pluginId: data.route.pluginId,
          pluginName: data.route.pluginName,
        }}
        className="plugin-page-content"
      />
    </div>
  )
}
