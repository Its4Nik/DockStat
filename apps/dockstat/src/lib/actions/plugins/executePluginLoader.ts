import { extractEdenError } from "@dockstat/utils"
import { api } from "../../api"

export async function executePluginLoader(input: {
  pluginId: number
  loaderId: string
  path: string
  state?: Record<string, unknown>
}) {
  const { data, error } = await api.api.v2.plugins
    .frontend({ pluginId: input.pluginId })
    .loaders({ loaderId: input.loaderId })
    .execute.post({
      path: input.path,
      state: input.state,
    })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
