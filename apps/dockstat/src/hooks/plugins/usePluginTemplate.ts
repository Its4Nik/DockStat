import { useEffect, useMemo } from "react"
import type { PluginPageData } from "@/components/plugins/id/types"
import type { TemplateFragment, PageTemplate } from "@dockstat/template-renderer"
import { parseTemplate } from "@dockstat/template-renderer"
import { api } from "@/lib/api"
import { useEdenMutation } from "../useEdenMutation"

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

  // Auto-fetch on mount: explicitly pass the path in the body
  useEffect(() => {
    mutate({ path: routePath })
  }, [mutate, routePath])

  const data = useMemo<PluginPageData | null>(() => {
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
  }, [rawData, queryError])

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

  return {
    data,
    isLoading,
    parsedTemplate,
    parsedFragments,
    fetchTemplate: (path: string) => mutate({ path }),
    fetchTemplateAsync: (path: string) => mutateAsync({ path }),
  }
}
