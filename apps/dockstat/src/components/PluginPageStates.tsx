import { motion } from "framer-motion"
import { AlertTriangle, ArrowLeft, FileX, Loader2, Search } from "lucide-react"
import { Card } from "@dockstat/ui"
import { useNavigate } from "react-router"

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

const HomeButton = () => {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-all active:scale-95"
    >
      <ArrowLeft className="h-4 w-4" />
      Go Home
    </button>
  )
}

export const PluginPageLoading = () => (
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

export const PluginPageError = ({
  pluginId,
  routePath,
  error,
}: {
  pluginId: number
  routePath: string
  error: string
}) => (
  <motion.div
    className="w-full max-w-md mx-auto mt-12"
    initial="initial"
    animate="animate"
    variants={cardVariants}
  >
    <Card variant="elevated" size="md">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="p-4 rounded-full bg-error/10">
          <AlertTriangle className="h-8 w-8 text-error" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-primary-text">Plugin Error</h1>
          <p className="text-secondary-text">{error}</p>
        </div>
        <div className="w-full bg-muted/50 rounded-lg p-4 mt-2 space-y-1">
          <InfoBlock label="Plugin ID" value={String(pluginId)} />
          <InfoBlock label="Route" value={`/${routePath}`} />
        </div>
        <HomeButton />
      </div>
    </Card>
  </motion.div>
)

export const PluginPageNotFound = ({
  pluginId,
  routePath,
}: {
  pluginId: number
  routePath: string
}) => (
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
        <HomeButton />
      </div>
    </Card>
  </motion.div>
)

export const PluginPageNoTemplate = ({
  pluginName,
  route,
}: {
  pluginName: string
  route: string
}) => (
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
          <InfoBlock label="Plugin" value={pluginName} />
          <InfoBlock label="Route" value={route} />
        </div>
        <HomeButton />
      </div>
    </Card>
  </motion.div>
)
