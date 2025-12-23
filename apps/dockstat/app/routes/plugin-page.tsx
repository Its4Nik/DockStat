/**
 * Plugin Page Route
 *
 * Renders plugin frontend pages using the template renderer.
 * Route: /p/:pluginId/*
 */

import { useLoaderData, useNavigate, useParams } from "react-router"
import {
  TemplateRenderer,
  parseTemplate,
  type PageTemplate,
  type TemplateFragment,
} from "@dockstat/template-renderer"
import { useState, useCallback, useMemo } from "react"
import { Card } from "@dockstat/ui"
import type { Route } from "./+types/plugin-page"
import { ServerAPI } from "../.server"

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
      error: "Invalid plugin ID",
      pluginId: 0,
      routePath,
    }
  }

  try {
    const response = await ServerAPI.plugins
      .frontend({ pluginId: pluginId })
      .template.put({ path: routePath })

    if (response.error || !response.data) {
      return {
        route: null,
        template: null,
        fragments: [],
        error: response.error?.value?.toString() || "Failed to load plugin page",
        pluginId,
        routePath,
      }
    }

    const data = response.data as {
      route?: PluginPageLoaderData["route"]
      template?: unknown
      fragments?: unknown[]
      error?: string
    }

    if (data.error) {
      return {
        route: null,
        template: null,
        fragments: [],
        error: data.error,
        pluginId,
        routePath,
      }
    }

    return {
      route: data.route || null,
      template: data.template || null,
      fragments: data.fragments || [],
      pluginId,
      routePath,
    }
  } catch (error) {
    return {
      route: null,
      template: null,
      fragments: [],
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

export default function PluginPage() {
  const data = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const params = useParams()

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

  // Template state management
  const [state, setState] = useState<Record<string, unknown>>(parsedTemplate?.state?.initial || {})

  const handleStateChange = useCallback((updates: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Action handler for custom plugin actions
  const handleAction = useCallback(async (actionId: string, payload?: unknown) => {
    console.log(`Plugin action triggered: ${actionId}`, payload)

    // Actions could call plugin API routes
    // For now, we just log them
    // In the future, this could be extended to:
    // 1. Call plugin API endpoints
    // 2. Trigger state updates
    // 3. Show modals/dialogs
    // etc.
  }, [])

  // Navigation handler
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
        data={{}}
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
