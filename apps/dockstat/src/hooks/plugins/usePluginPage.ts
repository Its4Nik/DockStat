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
    pluginId,
    routePath,
    loaders: data?.loaders || [],
    state,
    onStateUpdate: (key, value) => setState((prev) => ({ ...prev, [key]: value })),
    onExternalDataUpdate: updateExternalData,
  })

  const { handleAction, registerCustomHandler, isExecutingAction } = usePluginActions({
    pluginId,
    routePath,
    actions: data?.actions || [],
    parsedTemplate: parsedTemplate || null,
    state,
    onStateChange: handleStateChange,
    onNavigate: handleNavigate,
    reloadLoaders,
  })

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
    executeLoader,
    reloadLoaders,
    registerCustomHandler,
    isExecutingAction,
    isExecutingLoader,
  }
}
