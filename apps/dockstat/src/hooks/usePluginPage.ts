import type { ActionConfig, PageTemplate, TemplateFragment } from "@dockstat/template-renderer"
import { parseTemplate } from "@dockstat/template-renderer"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { executePluginAction, executePluginLoader } from "@/lib/actions/plugins"
import { fetchPluginTemplate } from "@/lib/queries/plugins"
import type { LoaderResult, PluginPageData, ResolvedAction } from "@/components/plugins/id/types"

function getValueByPath(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined
  const parts = path.split(".")
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

export function usePluginPage() {
  const navigate = useNavigate()
  const params = useParams()
  const pluginId = Number(params.pluginId)
  const routePath = params["*"] || ""
  const isValidPluginId = !Number.isNaN(pluginId)

  const customHandlersRef = useRef<Map<string, (payload?: unknown) => void | Promise<void>>>(
    new Map()
  )

  // Fetch plugin template data
  const {
    data: rawData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["plugin-template", pluginId, routePath],
    queryFn: ({ signal }) => fetchPluginTemplate({ signal }, pluginId, routePath),
    enabled: isValidPluginId,
  })

  // Normalize the data
  const data = useMemo<PluginPageData | null>(() => {
    if (!isValidPluginId) {
      return {
        route: null,
        template: null,
        fragments: [],
        loaders: [],
        actions: [],
        initialData: { loaderResults: [], state: {}, data: {} },
        error: "Invalid plugin ID",
      }
    }

    if (queryError) {
      return {
        route: null,
        template: null,
        fragments: [],
        loaders: [],
        actions: [],
        initialData: { loaderResults: [], state: {}, data: {} },
        error: queryError instanceof Error ? queryError.message : "Unknown error",
      }
    }

    if (!rawData) return null

    const response = rawData as PluginPageData & { error?: string }

    if (response.error) {
      return {
        route: null,
        template: null,
        fragments: [],
        loaders: [],
        actions: [],
        initialData: { loaderResults: [], state: {}, data: {} },
        error: response.error,
      }
    }

    return {
      route: response.route || null,
      template: response.template || null,
      fragments: response.fragments || [],
      loaders: response.loaders || [],
      actions: response.actions || [],
      initialData: response.initialData || {
        loaderResults: [],
        state: {},
        data: {},
      },
    }
  }, [rawData, queryError, isValidPluginId])

  const parsedTemplate = useMemo(() => {
    if (!data?.template) return null

    try {
      if (typeof data.template === "object" && data.template !== null) {
        return data.template as PageTemplate
      }
      if (typeof data.template === "string") {
        return parseTemplate(data.template).data
      }
      return null
    } catch {
      return null
    }
  }, [data?.template])

  const parsedFragments = useMemo(() => {
    if (!data?.fragments?.length) return {}

    const map: Record<string, TemplateFragment> = {}
    for (const fragment of data.fragments) {
      if (typeof fragment === "object" && fragment !== null && "id" in fragment) {
        const f = fragment as TemplateFragment
        map[f.id] = f
      }
    }
    return map
  }, [data?.fragments])

  // State management
  const [state, setState] = useState<Record<string, unknown>>({})
  const [externalData, setExternalData] = useState<Record<string, unknown>>({})

  // Sync state when data loads
  useEffect(() => {
    if (data?.initialData) {
      setState((prev) => ({
        ...parsedTemplate?.state?.initial,
        ...prev,
        ...data.initialData.state,
      }))
      setExternalData(data.initialData.data)
    }
  }, [data?.initialData, parsedTemplate?.state?.initial])

  const handleStateChange = useCallback((updates: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleNavigate = useCallback(
    (path: string) => {
      if (path.startsWith("./") || !path.startsWith("/")) {
        const basePath = `/p/${params.pluginId}`
        const resolved = path.startsWith("./") ? path.slice(2) : path
        navigate(`${basePath}/${resolved}`)
      } else {
        navigate(path)
      }
    },
    [navigate, params.pluginId]
  )

  // Loader mutation
  const loaderMutation = useMutation({
    mutationFn: async ({
      loaderId,
      currentState,
    }: {
      loaderId: string
      currentState: Record<string, unknown>
    }) => {
      if (!data?.route) throw new Error("No route")

      const response = await executePluginLoader({
        pluginId: data.route.pluginId,
        loaderId,
        path: routePath,
        state: currentState,
      })

      return { loaderId, result: (response as { result?: LoaderResult }).result }
    },
    onSuccess: ({ loaderId, result }) => {
      if (!result?.success) return

      if (result.stateKey) {
        // biome-ignore lint/style/noNonNullAssertion: literally checked one line above
        setState((prev) => ({ ...prev, [result.stateKey!]: result.data }))
      }
      if (result.dataKey) {
        // biome-ignore lint/style/noNonNullAssertion: literally checked one line above
        setExternalData((prev) => ({ ...prev, [result.dataKey!]: result.data }))
      }
      if (!result.stateKey && !result.dataKey) {
        setExternalData((prev) => ({ ...prev, [loaderId]: result.data }))
      }
    },
  })

  const executeLoader = useCallback(
    (loaderId: string) => loaderMutation.mutateAsync({ loaderId, currentState: state }),
    [loaderMutation, state]
  )

  const reloadLoaders = useCallback(
    async (loaderIds?: string[]) => {
      const ids = loaderIds || data?.loaders.map((l) => l.id) || []
      await Promise.all(ids.map((id) => executeLoader(id)))
    },
    [data?.loaders, executeLoader]
  )

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      payload,
      currentState,
    }: {
      action: ResolvedAction
      payload?: unknown
      currentState: Record<string, unknown>
    }) => {
      if (!data?.route) throw new Error("No route")

      const response = await executePluginAction({
        pluginId: String(data.route.pluginId),
        actionId: action.id,
        path: routePath,
        state: currentState,
        payload,
      })

      return {
        action,
        result: (
          response as {
            result?: {
              actionId: string
              success: boolean
              data?: unknown
              error?: string
              executedAt: number
            }
          }
        ).result,
      }
    },
    onSuccess: ({ action, result }) => {
      if (!result) return

      if (result.success && action.onSuccess) {
        if (action.onSuccess.setState) {
          const updates: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(action.onSuccess.setState)) {
            if (typeof value === "string" && value.startsWith("result.")) {
              updates[key] = getValueByPath(result.data as Record<string, unknown>, value.slice(7))
            } else {
              updates[key] = value
            }
          }
          handleStateChange(updates)
        }
        if (action.onSuccess.navigate) handleNavigate(action.onSuccess.navigate)
      } else if (!result.success && action.onError?.setState) {
        handleStateChange(action.onError.setState)
      }
    },
    onError: (_, { action }) => {
      if (action.onError?.setState) handleStateChange(action.onError.setState)
    },
  })

  const handleAction = useCallback(
    async (actionId: string, payload?: unknown) => {
      const action = data?.actions.find((a) => a.id === actionId)
      const templateAction = parsedTemplate?.actions?.find((a) => a.id === actionId)
      const actionDef = (action || templateAction) as
        | (ActionConfig & { handler?: string })
        | undefined

      if (!actionDef) {
        const custom = customHandlersRef.current.get(actionId)
        if (custom) await custom(payload)
        return
      }

      if (actionDef.confirm) {
        const confirmed = window.confirm(actionDef.confirm.message || "Are you sure?")
        if (!confirmed) return
      }

      switch (actionDef.type) {
        case "setState":
          if (actionDef.stateUpdates) handleStateChange(actionDef.stateUpdates)
          break
        case "navigate":
          if (actionDef.path) handleNavigate(actionDef.path)
          break
        case "api":
          if (action) {
            await actionMutation.mutateAsync({
              action,
              payload,
              currentState: state,
            })
          }
          break
        case "reload":
          await reloadLoaders(actionDef.loaderIds)
          break
        case "custom": {
          const handler = customHandlersRef.current.get(actionDef.handler || actionId)
          if (handler) await handler(payload)
          break
        }
      }
    },
    [
      data?.actions,
      parsedTemplate,
      handleStateChange,
      handleNavigate,
      actionMutation,
      state,
      reloadLoaders,
    ]
  )

  // Polling
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = []

    for (const loader of data?.loaders || []) {
      if (loader.polling?.enabled && loader.polling.interval > 0) {
        const enabled =
          typeof loader.polling.enabled === "string"
            ? Boolean(getValueByPath(state, loader.polling.enabled))
            : loader.polling.enabled

        if (enabled) {
          intervals.push(
            setInterval(
              () => loaderMutation.mutate({ loaderId: loader.id, currentState: state }),
              loader.polling.interval
            )
          )
        }
      }
    }

    return () => intervals.forEach(clearInterval)
  }, [data?.loaders, state, loaderMutation])

  return {
    data,
    isLoading,
    pluginId,
    routePath,
    state,
    externalData,
    parsedTemplate,
    parsedFragments,
    handleStateChange,
    handleAction,
    handleNavigate,
    isExecutingAction: actionMutation.isPending,
    isExecutingLoader: loaderMutation.isPending,
  }
}
