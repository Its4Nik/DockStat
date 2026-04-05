import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export function usePluginRoutes() {
  const { data: frontendPluginRoutes } = eden.useEdenQuery({
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })
  return frontendPluginRoutes
}
