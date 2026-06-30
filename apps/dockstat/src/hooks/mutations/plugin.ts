import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const usePluginMutations = () => {
  const eden = useContext(EdenClientContext)

  const installPluginMutation = eden.mutate({
    invalidateQueries: [["fetchAllPlugins"], ["fetchFrontendPluginRoutes"]],
    mutationKey: ["installPlugin"],
    route: api.plugins.install.post,
    toast: {
      errorTitle: (plugin) => `Failed to install ${plugin.name}`,
      successTitle: (plugin) => `Installed ${plugin.name}`,
    },
  })

  const deletePluginMutation = eden.mutate({
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

export const usePluginTemplateMutation = (pluginId: number) => {
  const eden = useContext(EdenClientContext)

  return eden.mutate({
    mutationKey: ["plugin-template", String(pluginId)],
    route: api.plugins.frontend({ pluginId }).template.post,
    toast: {
      errorTitle: "Failed to load plugin template",
      successTitle: "Plugin template loaded",
    },
  })
}
