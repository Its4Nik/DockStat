import { useEdenClient } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export function usePluginRoutes() {
  const eden = useEdenClient()

  const { data: frontendPluginRoutes } = eden.query({
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })
  return frontendPluginRoutes
}
