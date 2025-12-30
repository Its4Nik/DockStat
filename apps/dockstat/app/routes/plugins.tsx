import PluginLoader from "!L+A/loaders/plugins"
import { Divider, Slides } from "@dockstat/ui"
import { useLoaderData } from "react-router"
import { StatusBar } from "~/components/plugins/StatusBar"

export const loader = PluginLoader

export default function Plugins() {
  const { hooks, server_routes, frontend_routes, status } = useLoaderData<typeof loader>()

  const installedPluginsCount = status.installed_plugins.count
  const frontendRoutesCount = frontend_routes.length
  const serverRoutesCount = server_routes.length
  const hooksCount = hooks.length
  const loadedPluginsCount = status.loaded_plugins.length

  return (
    <div className="w-[95vw] mx-auto py-6 space-y-6">
      <StatusBar
        installedPluginsCount={installedPluginsCount}
        frontendRoutesCount={frontendRoutesCount}
        serverRoutesCount={serverRoutesCount}
        hooksCount={hooksCount}
        loadedPluginsCount={loadedPluginsCount}
      />

      <Divider />
    </div>
  )
}
