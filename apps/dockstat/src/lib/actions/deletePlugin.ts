import { extractEdenError } from "@dockstat/utils"
import { api } from "../api"

export async function deletePlugin(id: number) {
  const { data, error } = await api.api.v2.plugins.delete.post({ pluginId: id })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
