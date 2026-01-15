import {
  type PageTemplate,
  parseTemplate,
  type TemplateFragment,
} from "@dockstat/template-renderer"
import type { PluginPageData } from "@/components/plugins/id/types"

const emptyPluginPageData: PluginPageData = {
  route: null,
  template: null,
  fragments: [],
  loaders: [],
  actions: [],
  initialData: { loaderResults: [], state: {}, data: {} },
  error: undefined,
}

export function normalizePluginPageData(
  rawData: unknown,
  queryError: unknown
): PluginPageData | null {
  if (queryError) {
    return {
      ...emptyPluginPageData,
      error: queryError instanceof Error ? queryError.message : "Unknown error",
    }
  }

  if (!rawData) return null

  const response = rawData as PluginPageData & { error?: string }

  if (response.error) {
    return { ...emptyPluginPageData, error: response.error }
  }

  return {
    ...emptyPluginPageData,
    ...response,
    initialData: response.initialData ?? emptyPluginPageData.initialData,
  }
}

export function parsePageTemplate(template: PluginPageData["template"]): PageTemplate | null {
  if (!template) return null
  try {
    if (typeof template === "object") return template as PageTemplate
    if (typeof template === "string") return parseTemplate(template).data || null
  } catch {
    // fall through
  }
  return null
}

export function buildFragmentMap(
  fragments: PluginPageData["fragments"]
): Record<string, TemplateFragment> {
  const map: Record<string, TemplateFragment> = {}
  for (const fragment of fragments ?? []) {
    if (fragment && typeof fragment === "object" && "id" in fragment) {
      const f = fragment as TemplateFragment
      map[f.id] = f
    }
  }
  return map
}
