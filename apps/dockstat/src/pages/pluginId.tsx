import { TemplateRenderer } from "@dockstat/template-renderer"
import { Card } from "@dockstat/ui"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowLeft, FileX, Home, Loader2, Search } from "lucide-react"
import { useContext } from "react"
import { useNavigate } from "react-router"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"
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

  useContext(PageHeadingContext).setHeading(
    data?.route?.meta?.title ? data.route.meta.title : `/p/${pluginId}/${routePath}`
  )

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  const InfoBlock = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between text-xs font-mono text-secondary-text/70 py-1 border-b border-border/50 last:border-0">
      <span>{label}:</span>
      <span className="text-secondary-text">{value}</span>
    </div>
  )

  if (isLoading) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto mt-12"
        initial="initial"
        animate="animate"
        variants={cardVariants}
      >
        <Card variant="elevated" size="md">
          <div className="flex flex-col items-center justify-center gap-6 p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-secondary-text">Loading plugin page...</p>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (data?.error) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto mt-12"
        initial="initial"
        animate="animate"
        variants={cardVariants}
      >
        <Card variant="elevated" size="md">
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="p-4 rounded-full bg-red-500/10">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-primary-text">Plugin Error</h1>
              <p className="text-secondary-text">{data.error}</p>
            </div>
            <div className="w-full bg-muted/50 rounded-lg p-4 mt-2 space-y-1">
              <InfoBlock label="Plugin ID" value={String(pluginId)} />
              <InfoBlock label="Route" value={`/${routePath}`} />
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-all active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (!data?.route) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto mt-12"
        initial="initial"
        animate="animate"
        variants={cardVariants}
      >
        <Card variant="elevated" size="md">
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="p-4 rounded-full bg-muted/10">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-primary-text">Not Found</h1>
              <p className="text-secondary-text">The requested plugin page could not be found.</p>
            </div>
            <div className="w-full bg-muted/50 rounded-lg p-4 mt-2 space-y-1">
              <InfoBlock label="Plugin ID" value={String(pluginId)} />
              <InfoBlock label="Route" value={`/${routePath}`} />
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-all active:scale-95"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (!parsedTemplate) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto mt-12"
        initial="initial"
        animate="animate"
        variants={cardVariants}
      >
        <Card variant="elevated" size="md">
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="p-4 rounded-full bg-muted/10">
              <FileX className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-primary-text">No Template</h1>
              <p className="text-secondary-text">
                This plugin page doesn't have a valid template configured.
              </p>
            </div>
            <div className="w-full bg-muted/50 rounded-lg p-4 mt-2 space-y-1">
              <InfoBlock label="Plugin" value={data.route.pluginName} />
              <InfoBlock label="Route" value={data.route.path} />
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-all active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </Card>
      </motion.div>
    )
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
