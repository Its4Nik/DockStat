import { TemplateRenderer } from "@dockstat/template-renderer"
import { usePageHeading } from "@/hooks/useHeading"
import { usePluginPage } from "@/hooks/plugins/usePluginPage"
import {
  PluginPageLoading,
  PluginPageError,
  PluginPageNotFound,
  PluginPageNoTemplate,
} from "@/components/PluginPageStates"

export default function PluginIdPage() {
  const {
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
  } = usePluginPage()

  const heading = data?.route?.meta?.title ? data.route.meta.title : `/p/${pluginId}/${routePath}`

  usePageHeading(heading)

  if (isLoading) return <PluginPageLoading />

  if (data?.error) {
    return <PluginPageError pluginId={pluginId} routePath={routePath} error={data.error} />
  }

  if (!data?.route) {
    return <PluginPageNotFound pluginId={pluginId} routePath={routePath} />
  }

  if (!parsedTemplate) {
    return <PluginPageNoTemplate pluginName={data.route.pluginName} route={data.route.path} />
  }

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
        data={externalData}
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
