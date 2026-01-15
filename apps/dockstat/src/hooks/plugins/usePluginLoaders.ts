import { useCallback, useEffect } from "react"
import type { LoaderResult, ResolvedLoader } from "@/components/plugins/id/types"
import { api } from "@/lib/api"
import { useEdenRouteMutation } from "../eden/useEdenRouteMutation"
import { getValueByPath } from "./utils"

type UsePluginLoadersParams = {
  pluginId: number
  routePath: string
  loaders: ResolvedLoader[]
  state: Record<string, unknown>
  onStateUpdate: (key: string, value: unknown) => void
  onExternalDataUpdate: (key: string, value: unknown) => void
}

export function usePluginLoaders({
  pluginId,
  routePath,
  loaders,
  state,
  onStateUpdate,
  onExternalDataUpdate,
}: UsePluginLoadersParams) {
  const loaderMutation = useEdenRouteMutation({
    mutationKey: ["executeLoader", String(pluginId)],
    routeBuilder: ({ loaderId }: { loaderId: string }) =>
      api.plugins.frontend({ pluginId }).loaders({ loaderId }).execute.post,
  })

  const executeLoader = useCallback(
    async (loaderId: string) => {
      const res = await loaderMutation.mutateAsync({
        params: { loaderId },
        body: { path: routePath, state },
      })

      const result = (res as { result?: LoaderResult }).result
      if (!result?.success) return

      if (result.stateKey) {
        onStateUpdate(result.stateKey, result.data)
      } else if (result.dataKey) {
        onExternalDataUpdate(result.dataKey, result.data)
      } else {
        onExternalDataUpdate(loaderId, result.data)
      }

      return result
    },
    [loaderMutation, routePath, state, onStateUpdate, onExternalDataUpdate]
  )

  const reloadLoaders = useCallback(
    async (loaderIds?: string[]) => {
      const ids = loaderIds || loaders.map((l) => l.id)
      await Promise.all(ids.map((id) => executeLoader(id)))
    },
    [loaders, executeLoader]
  )

  // Polling
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = []

    for (const loader of loaders) {
      if (loader.polling?.enabled && loader.polling.interval > 0) {
        const enabled =
          typeof loader.polling.enabled === "string"
            ? Boolean(getValueByPath(state, loader.polling.enabled))
            : loader.polling.enabled

        if (enabled) {
          intervals.push(setInterval(() => executeLoader(loader.id), loader.polling.interval))
        }
      }
    }

    return () => intervals.forEach(clearInterval)
  }, [loaders, state, executeLoader])

  return {
    executeLoader,
    reloadLoaders,
    isExecutingLoader: loaderMutation.isPending,
  }
}
