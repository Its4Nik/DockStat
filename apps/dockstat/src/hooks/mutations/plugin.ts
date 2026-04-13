import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const usePluginMutations = () => {
  const installPluginMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAllPlugins"], ["fetchFrontendPluginRoutes"]],
    mutationKey: ["installPlugin"],
    route: api.plugins.install.post,
    toast: {
      errorTitle: (plugin) => `Failed to install ${plugin.name}`,
      successTitle: (plugin) => `Installed ${plugin.name}`,
    },
  })

  const deletePluginMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAllPlugins"], ["fetchFrontendPluginRoutes"]],
    mutationKey: ["deletePlugin"],
    route: api.plugins.delete.post,
    toast: {
      errorTitle: (p) => `Error while uninstalling PluginID: ${p.pluginId}`,
      successTitle: (p) => `Uninstalled PluginID: ${p.pluginId}`,
    },
  })

  return {
    deletePluginMutation,
    installPluginMutation,
  }
}

export const usePluginTemplateMutation = (pluginId: number) =>
  eden.useEdenMutation({
    mutationKey: ["plugin-template", String(pluginId)],
    route: api.plugins.frontend({ pluginId }).template.post,
  })
