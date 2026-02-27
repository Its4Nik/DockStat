import { useEdenQuery } from "@/hooks/useEdenQuery"
import { api } from "@/lib/api"

export function usePluginRoutes() {
  const { data: frontendPluginRoutes } = useEdenQuery({
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })
  return frontendPluginRoutes
}
