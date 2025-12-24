import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { AnimatePresence } from "framer-motion"
import { Package } from "lucide-react"
import { useState } from "react"
import { PluginCard } from "./PluginCard"
import { PluginDetailModal } from "./PluginDetailModal"
import type { InstalledPlugin, PluginsListProps } from "./types"

export function PluginsList({ plugins, loadedPluginIds, verifications }: PluginsListProps) {
  const [selectedPlugin, setSelectedPlugin] = useState<InstalledPlugin | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handlePluginClick = (pluginId: number) => {
    const plugin = plugins.find((p) => p.id === pluginId)
    if (plugin) {
      setSelectedPlugin(plugin)
      setModalOpen(true)
    }
  }

  if (plugins.length === 0) {
    return (
      <Card variant="outlined" size="sm" className="w-full">
        <CardBody className="text-center text-muted-text py-12">
          <Package className="mx-auto mb-3 opacity-50" size={48} />
          <p className="text-lg font-medium">No plugins installed</p>
          <p className="text-sm mt-1">
            Add a repository and install plugins to extend DockStat's functionality
          </p>
        </CardBody>
      </Card>
    )
  }

  // Sort plugins: loaded first, then by name
  const sortedPlugins = [...plugins].sort((a, b) => {
    const aLoaded = loadedPluginIds.includes(a.id)
    const bLoaded = loadedPluginIds.includes(b.id)
    if (aLoaded !== bLoaded) return bLoaded ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  // Calculate verification stats
  const verifiedCount = verifications
    ? Array.from(verifications.values()).filter((v) => v.isVerified).length
    : 0
  const safeCount = verifications
    ? Array.from(verifications.values()).filter((v) => v.securityStatus === "safe").length
    : 0

  const selectedPluginIsLoaded = selectedPlugin
    ? loadedPluginIds.includes(selectedPlugin.id)
    : false
  const selectedPluginVerification = selectedPlugin
    ? (verifications?.get(selectedPlugin.id) ?? null)
    : null

  return (
    <>
      <Card variant="default" size="sm" className="w-full">
        <CardHeader className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-accent" />
            <span>Installed Plugins</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" rounded>
              {loadedPluginIds.length} active
            </Badge>
            <Badge variant="success" size="sm" rounded>
              {verifiedCount} verified
            </Badge>
            <Badge variant="warning" size="sm" rounded>
              {safeCount} safe
            </Badge>
            <Badge variant="secondary" size="sm" rounded>
              {plugins.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="p-4">
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {sortedPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  isLoaded={loadedPluginIds.includes(plugin.id)}
                  verification={verifications?.get(plugin.id) ?? null}
                  onClick={handlePluginClick}
                />
              ))}
            </AnimatePresence>
          </div>
        </CardBody>
      </Card>

      <PluginDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plugin={selectedPlugin}
        isLoaded={selectedPluginIsLoaded}
        verification={selectedPluginVerification}
      />
    </>
  )
}
