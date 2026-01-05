import { TemplateRenderer } from "@dockstat/template-renderer"
import { Card } from "@dockstat/ui"
import { useNavigate } from "react-router"
import { usePluginPage } from "@/hooks/usePluginPage"

export default function PluginIdPage() {
  const navigate = useNavigate()
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

  if (isLoading) {
    return (
      <div className="w-[95vw] mx-auto mt-8">
        <Card variant="elevated" size="md" className="text-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="text-4xl animate-spin">⏳</div>
            <p className="text-secondary-text">Loading plugin page...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (data?.error) {
    return (
      <div className="w-[95vw] mx-auto mt-8">
        <Card variant="elevated" size="md" className="text-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-primary-text">
              Plugin Page Error
            </h1>
            <p className="text-secondary-text">{data.error}</p>
            <div className="text-sm text-secondary-text mt-4">
              <p>Plugin ID: {pluginId}</p>
              <p>Route: /{routePath}</p>
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

  if (!data?.route) {
    return (
      <div className="w-[95vw] mx-auto mt-8">
        <Card variant="elevated" size="md" className="text-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="text-6xl">🔍</div>
            <h1 className="text-2xl font-bold text-primary-text">
              Page Not Found
            </h1>
            <p className="text-secondary-text">
              The requested plugin page could not be found.
            </p>
            <div className="text-sm text-secondary-text mt-4">
              <p>Plugin ID: {pluginId}</p>
              <p>Route: /{routePath}</p>
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

  return (
    <div className="w-[95vw] mx-auto mt-4">
      {data.route.meta?.title && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-primary-text">
            {data.route.meta.title}
          </h1>
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
