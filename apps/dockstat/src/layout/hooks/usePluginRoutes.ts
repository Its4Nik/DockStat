import { eden } from "@dockstat/utils/react"
import { api, getAuthHeaders } from "@/lib/api"

export function usePluginRoutes() {
  const { data: frontendPluginRoutes } = eden.useEdenQuery({
    opts: {
      headers: getAuthHeaders(),
    },
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })
  return frontendPluginRoutes
}
