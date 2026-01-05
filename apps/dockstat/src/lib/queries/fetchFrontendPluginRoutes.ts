import { extractEdenError } from "@dockstat/utils"
import { api } from "../api"

export async function fetchFrontendPluginRoutes() {
  const { data, error } = await api.api.v2.plugins.frontend.routes["by-plugin"].get()

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  const pluginLinks = data.map((plugin) => ({
    pluginName: plugin.pluginName,
    paths: plugin.routes.map((routeData) => ({
      fullPath: routeData.path,
      metaTitle: routeData.meta?.title || "Unknown",
    })),
  }))

  return pluginLinks
}
