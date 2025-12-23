/**
 * Template Hooks
 *
 * React hooks for managing template state, actions, and rendering.
 * Supports local actions (setState, navigate) and remote actions (api, reload, custom).
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ActionConfig, LoaderConfig, PageTemplate, TemplateFragment } from "../types"

/**
 * State returned by useTemplateState hook
 */
export interface UseTemplateStateResult {
  /** Current state values */
  state: Record<string, unknown>
  /** Update state with partial updates */
  setState: (updates: Record<string, unknown>) => void
  /** Reset state to initial values */
  resetState: () => void
  /** Get a specific state value by key */
  getValue: <T = unknown>(key: string) => T | undefined
  /** Set a specific state value by key */
  setValue: (key: string, value: unknown) => void
}

/**
 * Hook for managing template state
 *
 * @param template - The template containing initial state definition
 * @param initialOverrides - Optional initial state overrides
 * @returns State management utilities
 */
export function useTemplateState(
  template: PageTemplate,
  initialOverrides?: Record<string, unknown>
): UseTemplateStateResult {
  const initialState = useMemo(() => {
    return { ...template.state?.initial, ...initialOverrides }
  }, [template.state?.initial, initialOverrides])

  const [state, setStateInternal] = useState<Record<string, unknown>>(initialState)

  const setState = useCallback((updates: Record<string, unknown>) => {
    setStateInternal((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetState = useCallback(() => {
    setStateInternal(initialState)
  }, [initialState])

  const getValue = useCallback(
    <T = unknown>(key: string): T | undefined => {
      return state[key] as T | undefined
    },
    [state]
  )

  const setValue = useCallback((key: string, value: unknown) => {
    setStateInternal((prev) => ({ ...prev, [key]: value }))
  }, [])

  return {
    state,
    setState,
    resetState,
    getValue,
    setValue,
  }
}

/**
 * Options for API action execution
 */
export interface ExecuteApiActionOptions {
  /** Plugin ID for the action */
  pluginId: number
  /** Route path for the action */
  routePath: string
  /** Current state values */
  state?: Record<string, unknown>
  /** Additional payload for the action */
  payload?: unknown
}

/**
 * Result from API action execution
 */
export interface ApiActionResult {
  success: boolean
  data?: unknown
  error?: string
}

/**
 * Function type for executing API actions
 * This allows the consumer to provide their own API implementation
 */
export type ApiActionExecutor = (
  actionId: string,
  options: ExecuteApiActionOptions
) => Promise<ApiActionResult | null>

/**
 * Function type for executing loaders
 * This allows the consumer to provide their own API implementation
 */
export type LoaderExecutor = (
  loaderId: string,
  options: {
    pluginId: number
    routePath: string
    state?: Record<string, unknown>
  }
) => Promise<{
  success: boolean
  data?: unknown
  error?: string
  stateKey?: string
  dataKey?: string
} | null>

/**
 * Result from useTemplateActions hook
 */
export interface UseTemplateActionsResult {
  /** Trigger an action by ID */
  triggerAction: (actionId: string, payload?: unknown) => Promise<void>
  /** Register a custom action handler */
  registerHandler: (actionId: string, handler: (payload?: unknown) => void | Promise<void>) => void
  /** Unregister a custom action handler */
  unregisterHandler: (actionId: string) => void
  /** Loading state for actions (action IDs currently executing) */
  loadingActions: Set<string>
  /** Check if an action is currently loading */
  isActionLoading: (actionId: string) => boolean
}

/**
 * Hook for managing template actions
 *
 * @param template - The template containing action definitions
 * @param setState - State update function from useTemplateState
 * @param navigate - Navigation function
 * @param options - Additional options for action handling
 * @returns Action management utilities
 */
export function useTemplateActions(
  template: PageTemplate,
  setState: (updates: Record<string, unknown>) => void,
  navigate?: (path: string) => void,
  options?: {
    pluginId?: number
    routePath?: string
    onReloadLoaders?: (loaderIds?: string[]) => Promise<void>
    /** Custom API action executor - if not provided, API actions will log a warning */
    apiExecutor?: ApiActionExecutor
  }
): UseTemplateActionsResult {
  const [customHandlers, setCustomHandlers] = useState<
    Record<string, (payload?: unknown) => void | Promise<void>>
  >({})
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())

  /**
   * Execute an API action using the provided executor or warn if not available
   */
  const executeApiAction = useCallback(
    async (
      action: ActionConfig,
      execOptions: ExecuteApiActionOptions
    ): Promise<ApiActionResult | null> => {
      if (action.type !== "api" || !action.apiRoute) {
        return null
      }

      if (!options?.apiExecutor) {
        console.warn(`API action "${action.id}" requires an apiExecutor to be provided in options`)
        return null
      }

      setLoadingActions((prev) => new Set(prev).add(action.id))

      try {
        const result = await options.apiExecutor(action.id, execOptions)

        if (result) {
          // Handle success/error callbacks
          if (result.success && action.onSuccess) {
            if (action.onSuccess.setState) {
              const stateUpdates: Record<string, unknown> = {}
              for (const [key, value] of Object.entries(action.onSuccess.setState)) {
                if (typeof value === "string" && value.startsWith("result.")) {
                  const path = value.slice(7)
                  stateUpdates[key] = getValueByPath(result.data as Record<string, unknown>, path)
                } else {
                  stateUpdates[key] = value
                }
              }
              setState(stateUpdates)
            }

            if (action.onSuccess.navigate && navigate) {
              navigate(action.onSuccess.navigate)
            }

            if (action.onSuccess.notify) {
              console.log(`[${action.onSuccess.notify.type}] ${action.onSuccess.notify.message}`)
            }
          } else if (!result.success && action.onError) {
            if (action.onError.setState) {
              setState(action.onError.setState)
            }

            if (action.onError.notify) {
              console.error(`[${action.onError.notify.type}] ${action.onError.notify.message}`)
            }
          }

          return result
        }

        return null
      } catch (error) {
        console.error(`Failed to execute API action ${action.id}:`, error)

        if (action.onError) {
          if (action.onError.setState) {
            setState(action.onError.setState)
          }
          if (action.onError.notify) {
            console.error(`[${action.onError.notify.type}] ${action.onError.notify.message}`)
          }
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      } finally {
        setLoadingActions((prev) => {
          const next = new Set(prev)
          next.delete(action.id)
          return next
        })
      }
    },
    [setState, navigate, options?.apiExecutor]
  )

  const triggerAction = useCallback(
    async (actionId: string, payload?: unknown) => {
      // Check for custom handler first
      const customHandler = customHandlers[actionId]
      if (customHandler) {
        await customHandler(payload)
        return
      }

      // Find action in template
      const action = template.actions?.find((a) => a.id === actionId)
      if (!action) {
        console.warn(`Action not found: ${actionId}`)
        return
      }

      // Handle confirmation if required
      if (action.confirm) {
        const confirmed = window.confirm(
          action.confirm.message || "Are you sure you want to perform this action?"
        )
        if (!confirmed) return
      }

      // Handle built-in action types
      switch (action.type) {
        case "setState":
          if (action.stateUpdates) {
            setState(action.stateUpdates)
          }
          break

        case "navigate":
          if (action.path && navigate) {
            navigate(action.path)
          } else if (action.path && !navigate) {
            console.warn(`Navigate action "${actionId}" requires navigate function`)
          }
          break

        case "api":
          if (options?.pluginId && options?.routePath) {
            await executeApiAction(action, {
              pluginId: options.pluginId,
              routePath: options.routePath,
              state: undefined, // Will be provided by the caller if needed
              payload,
            })
          } else {
            console.warn(`API action "${actionId}" requires pluginId and routePath in options`)
          }
          break

        case "reload":
          if (options?.onReloadLoaders) {
            await options.onReloadLoaders(action.loaderIds)
          } else {
            console.warn(`Reload action "${actionId}" requires onReloadLoaders in options`)
          }
          break

        case "custom": {
          const handler = customHandlers[action.handler || actionId]
          if (handler) {
            await handler(payload)
          } else {
            console.warn(`Custom action "${actionId}" requires a registered handler`)
          }
          break
        }

        default:
          console.warn(`Unknown action type: ${action.type}`)
      }
    },
    [template.actions, setState, navigate, customHandlers, options, executeApiAction]
  )

  const registerHandler = useCallback(
    (actionId: string, handler: (payload?: unknown) => void | Promise<void>) => {
      setCustomHandlers((prev) => ({ ...prev, [actionId]: handler }))
    },
    []
  )

  const unregisterHandler = useCallback((actionId: string) => {
    setCustomHandlers((prev) => {
      const { [actionId]: _, ...rest } = prev
      return rest
    })
  }, [])

  const isActionLoading = useCallback(
    (actionId: string) => {
      return loadingActions.has(actionId)
    },
    [loadingActions]
  )

  return {
    triggerAction,
    registerHandler,
    unregisterHandler,
    loadingActions,
    isActionLoading,
  }
}

/**
 * Result from useTemplateLoaders hook
 */
export interface UseTemplateLoadersResult {
  /** Execute a specific loader by ID */
  executeLoader: (loaderId: string) => Promise<unknown | null>
  /** Execute all loaders */
  executeAllLoaders: () => Promise<void>
  /** Reload specific loaders or all if no IDs provided */
  reloadLoaders: (loaderIds?: string[]) => Promise<void>
  /** Loading state for loaders (loader IDs currently executing) */
  loadingLoaders: Set<string>
  /** Check if a loader is currently loading */
  isLoaderLoading: (loaderId: string) => boolean
  /** Loaded data from loaders */
  loaderData: Record<string, unknown>
}

/**
 * Hook for managing template data loaders
 */
export function useTemplateLoaders(
  loaders: LoaderConfig[],
  options: {
    pluginId: number
    routePath: string
    state?: Record<string, unknown>
    onStateUpdate?: (updates: Record<string, unknown>) => void
    onDataUpdate?: (updates: Record<string, unknown>) => void
    /** Custom loader executor - if not provided, loaders will log a warning */
    loaderExecutor?: LoaderExecutor
  }
): UseTemplateLoadersResult {
  const [loadingLoaders, setLoadingLoaders] = useState<Set<string>>(new Set())
  const [loaderData, setLoaderData] = useState<Record<string, unknown>>({})

  const executeLoader = useCallback(
    async (loaderId: string): Promise<unknown | null> => {
      const loader = loaders.find((l) => l.id === loaderId)
      if (!loader) {
        console.warn(`Loader not found: ${loaderId}`)
        return null
      }

      if (!options.loaderExecutor) {
        console.warn(`Loader "${loaderId}" requires a loaderExecutor to be provided in options`)
        return null
      }

      setLoadingLoaders((prev) => new Set(prev).add(loaderId))

      try {
        const result = await options.loaderExecutor(loaderId, {
          pluginId: options.pluginId,
          routePath: options.routePath,
          state: options.state,
        })

        if (result?.success) {
          // Update state if stateKey is defined
          if (result.stateKey && options.onStateUpdate) {
            options.onStateUpdate({ [result.stateKey]: result.data })
          }

          // Update data
          const dataKey = result.dataKey || loaderId
          setLoaderData((prev) => ({ ...prev, [dataKey]: result.data }))

          if (options.onDataUpdate) {
            options.onDataUpdate({ [dataKey]: result.data })
          }

          return result.data
        }

        return null
      } catch (error) {
        console.error(`Failed to execute loader ${loaderId}:`, error)
        return null
      } finally {
        setLoadingLoaders((prev) => {
          const next = new Set(prev)
          next.delete(loaderId)
          return next
        })
      }
    },
    [loaders, options]
  )

  const executeAllLoaders = useCallback(async () => {
    await Promise.all(loaders.map((l) => executeLoader(l.id)))
  }, [loaders, executeLoader])

  const reloadLoaders = useCallback(
    async (loaderIds?: string[]) => {
      const idsToReload = loaderIds || loaders.map((l) => l.id)
      await Promise.all(idsToReload.map((id) => executeLoader(id)))
    },
    [loaders, executeLoader]
  )

  const isLoaderLoading = useCallback(
    (loaderId: string) => {
      return loadingLoaders.has(loaderId)
    },
    [loadingLoaders]
  )

  // Set up polling for loaders
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = []

    for (const loader of loaders) {
      if (loader.polling?.enabled && loader.polling.interval > 0) {
        const enabled =
          typeof loader.polling.enabled === "string"
            ? Boolean(getValueByPath(options.state || {}, loader.polling.enabled))
            : loader.polling.enabled

        if (enabled) {
          const interval = setInterval(() => {
            executeLoader(loader.id)
          }, loader.polling.interval)
          intervals.push(interval)
        }
      }
    }

    return () => {
      for (const interval of intervals) {
        clearInterval(interval)
      }
    }
  }, [loaders, options.state, executeLoader])

  return {
    executeLoader,
    executeAllLoaders,
    reloadLoaders,
    loadingLoaders,
    isLoaderLoading,
    loaderData,
  }
}

/**
 * Combined hook result for useTemplate
 */
export interface UseTemplateResult extends UseTemplateStateResult, UseTemplateActionsResult {
  /** The template being used */
  template: PageTemplate
  /** External data passed to the template */
  data: Record<string, unknown>
  /** Set external data */
  setData: (data: Record<string, unknown>) => void
  /** Available fragments */
  fragments: Record<string, TemplateFragment>
  /** Loader utilities (if loaders are provided) */
  loaders?: UseTemplateLoadersResult
}

/**
 * Combined hook for complete template management
 *
 * @param template - The template to use
 * @param options - Configuration options
 * @returns Complete template management utilities
 */
export function useTemplate(
  template: PageTemplate,
  options?: {
    initialState?: Record<string, unknown>
    initialData?: Record<string, unknown>
    fragments?: Record<string, TemplateFragment>
    navigate?: (path: string) => void
    pluginId?: number
    routePath?: string
    loaderConfigs?: LoaderConfig[]
    apiExecutor?: ApiActionExecutor
    loaderExecutor?: LoaderExecutor
  }
): UseTemplateResult {
  const {
    initialState,
    initialData,
    fragments = {},
    navigate,
    pluginId,
    routePath,
    loaderConfigs,
    apiExecutor,
    loaderExecutor,
  } = options ?? {}

  // State management
  const stateResult = useTemplateState(template, initialState)

  // External data
  const [data, setData] = useState<Record<string, unknown>>(initialData ?? {})

  // Loader management - always call the hook but with empty array if no loaders
  const loadersResult = useTemplateLoaders(
    loaderConfigs && pluginId && routePath ? loaderConfigs : [],
    {
      pluginId: pluginId ?? 0,
      routePath: routePath ?? "",
      state: stateResult.state,
      onStateUpdate: stateResult.setState,
      onDataUpdate: (updates) => setData((prev) => ({ ...prev, ...updates })),
      loaderExecutor,
    }
  )

  // Determine if we should expose loaders (only when properly configured)
  const hasLoaders = loaderConfigs && pluginId && routePath

  // Action management
  const actionsResult = useTemplateActions(template, stateResult.setState, navigate, {
    pluginId,
    routePath,
    onReloadLoaders: loadersResult.reloadLoaders,
    apiExecutor,
  })

  return {
    template,
    data,
    setData,
    fragments,
    loaders: hasLoaders ? loadersResult : undefined,
    ...stateResult,
    ...actionsResult,
  }
}

/**
 * Helper function to get a value from a nested object using dot notation
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
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
