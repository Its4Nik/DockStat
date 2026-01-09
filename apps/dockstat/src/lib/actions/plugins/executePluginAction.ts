import { extractEdenError } from "@dockstat/utils"
import { api } from "../../api"

export async function executePluginAction(input: {
  pluginId: string
  actionId: string
  path: string
  state?: Record<string, unknown>
  payload?: unknown
}) {
  const { data, error } = await api.api.v2.plugins
    .frontend({ pluginId: input.pluginId })
    .actions({ actionId: input.actionId })
    .execute.post({
      path: input.path,
      state: input.state,
      payload: input.payload,
    })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
