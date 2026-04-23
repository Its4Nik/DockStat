import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export function usePluginRoutes() {
  const eden = useContext(EdenClientContext)

  const { data: frontendPluginRoutes } = eden.query({
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })
  return frontendPluginRoutes
}
