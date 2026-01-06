import { extractEdenError } from "@dockstat/utils"
import { api } from "../api"

export async function fetchFrontendPluginRoutes() {
  const { data, error } = await api.api.v2.plugins.frontend.routes.get()

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
