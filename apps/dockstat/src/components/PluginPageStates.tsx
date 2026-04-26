import { Card, DockStatErrorCard } from "@dockstat/ui"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

const cardVariants = {
  animate: { opacity: 1, transition: { duration: 0.3 }, y: 0 },
  initial: { opacity: 0, y: 10 },
}

export const PluginPageLoading = () => (
  <motion.div
    animate="animate"
    className="w-full max-w-md mx-auto mt-12"
    initial="initial"
    variants={cardVariants}
  >
    <Card
      size="md"
      variant="elevated"
    >
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
  reqId,
}: {
  pluginId: number
  routePath: string
  error: string
  reqId?: string
}) => (
  <DockStatErrorCard
    action={{ label: `Plugin #${pluginId}`, onClick: () => {}, variant: "secondary" }}
    code="PLUGIN"
    description={error}
    details={[
      { field: "Route", message: `/${routePath}` },
      { field: "Plugin ID", message: String(pluginId) },
    ]}
    reqId={reqId}
    showHomeButton
    title="Plugin Error"
  />
)

export const PluginPageNotFound = ({
  pluginId,
  routePath,
}: {
  pluginId: number
  routePath: string
}) => (
  <DockStatErrorCard
    code="NOT_FOUND"
    description="The requested plugin page could not be found."
    details={[
      { field: "Route", message: `/${routePath}` },
      { field: "Plugin ID", message: String(pluginId) },
    ]}
    icon="search"
    showHomeButton
    status={404}
    title="Not Found"
  />
)

export const PluginPageNoTemplate = ({
  pluginName,
  route,
}: {
  pluginName: string
  route: string
}) => (
  <DockStatErrorCard
    code="PLUGIN"
    description="This plugin page doesn't have a valid template configured."
    details={[
      { field: "Plugin", message: pluginName },
      { field: "Route", message: route },
    ]}
    icon="file"
    showHomeButton
    title="No Template"
  />
)
