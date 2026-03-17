import { useEffect, useMemo } from "react"
import { usePluginTemplateMutation } from "@/hooks/mutations"
import {
  buildFragmentMap,
  normalizePluginPageData,
  parsePageTemplate,
} from "@/utils/normalizePluginPageData"

export function usePluginTemplate(pluginId: number, routePath: string) {
  const {
    data: rawData,
    error: queryError,
    isPending: isLoading,
    mutate,
    mutateAsync,
  } = usePluginTemplateMutation(pluginId)

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
