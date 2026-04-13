import { useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { usePluginActions } from "./usePluginActions"
import { usePluginLoaders } from "./usePluginLoaders"
import { usePluginState } from "./usePluginState"
import { usePluginTemplate } from "./usePluginTemplate"

export function usePluginPage() {
  const navigate = useNavigate()
  const params = useParams()
  const pluginId = Number(params.pluginId)
  const routePath = params["*"] || ""

  if (Number.isNaN(pluginId)) {
    throw new Error("Invalid plugin ID")
  }

  const { data, isLoading, parsedTemplate, parsedFragments } = usePluginTemplate(
    pluginId,
    routePath
  )

  const { state, externalData, handleStateChange, updateExternalData, setState } = usePluginState(
    data?.initialData,
    parsedTemplate || null
  )

  const handleNavigate = useCallback(
    (path: string) => {
      if (path.startsWith("./") || !path.startsWith("/")) {
        const basePath = `/p/${pluginId}`
        const resolved = path.startsWith("./") ? path.slice(2) : path
        navigate(`${basePath}/${resolved}`)
      } else {
        navigate(path)
      }
    },
    [navigate, pluginId]
  )

  const { executeLoader, reloadLoaders, isExecutingLoader } = usePluginLoaders({
    loaders: data?.loaders || [],
    onExternalDataUpdate: updateExternalData,
    onStateUpdate: (key, value) => setState((prev) => ({ ...prev, [key]: value })),
    pluginId,
    routePath,
    state,
  })

  const { handleAction, registerCustomHandler, isExecutingAction } = usePluginActions({
    actions: data?.actions || [],
    onNavigate: handleNavigate,
    onStateChange: handleStateChange,
    parsedTemplate: parsedTemplate || null,
    pluginId,
    reloadLoaders,
    routePath,
    state,
  })

  return {
    data,
    executeLoader,
    externalData,
    handleAction,
    handleNavigate,
    handleStateChange,
    isExecutingAction,
    isExecutingLoader,
    isLoading,
    parsedFragments,
    parsedTemplate,
    pluginId,
    registerCustomHandler,
    reloadLoaders,
    routePath,
    state,
  }
}
