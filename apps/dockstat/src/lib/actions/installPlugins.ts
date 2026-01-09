import type { DBPluginShemaT } from "@dockstat/typings/types"
import { extractEdenError } from "@dockstat/utils"
import { api } from "../api"

export async function installPlugin(pluginSchema: DBPluginShemaT) {
  const { data, error } = await api.api.v2.plugins.install.post(pluginSchema)

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
