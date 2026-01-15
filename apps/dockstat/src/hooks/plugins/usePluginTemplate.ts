import { useEffect, useMemo } from "react"
import { api } from "@/lib/api"
import {
  buildFragmentMap,
  normalizePluginPageData,
  parsePageTemplate,
} from "@/utils/normalizePluginPageData"
import { useEdenMutation } from "../eden/useEdenMutation"

export function usePluginTemplate(pluginId: number, routePath: string) {
  const {
    data: rawData,
    error: queryError,
    isPending: isLoading,
    mutate,
    mutateAsync,
  } = useEdenMutation({
    mutationKey: ["plugin-template", String(pluginId), routePath],
    route: api.plugins.frontend({ pluginId }).template.post,
  })

  useEffect(() => {
    mutate({ path: routePath })
  }, [mutate, routePath])

  const data = useMemo(() => normalizePluginPageData(rawData, queryError), [rawData, queryError])

  const parsedTemplate = useMemo(() => parsePageTemplate(data?.template), [data?.template])

  const parsedFragments = useMemo(() => buildFragmentMap(data?.fragments || []), [data?.fragments])

  return {
    data,
    isLoading,
    parsedTemplate,
    parsedFragments,
    fetchTemplate: (path: string) => mutate({ path }),
    fetchTemplateAsync: (path: string) => mutateAsync({ path }),
  }
}
