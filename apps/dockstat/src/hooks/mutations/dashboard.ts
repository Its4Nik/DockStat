import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const useDashboardMutations = () => {
  const eden = useContext(EdenClientContext)

  const setDefaultDashboardMutation = eden.mutate({
    invalidateQueries: [["fetchAdditionalSettings"], ["fetchAllDashboards"]],
    mutationKey: ["setDefaultDashboard"],
    route: api.db.config.defaultDashboard.post,
    toast: {
      errorTitle: () => "Could not set default dashboard",
      successTitle: (input) =>
        input.dashboardId
          ? `Set default dashboard to ${input.dashboardId}`
          : "Cleared default dashboard",
    },
  })

  return {
    setDefaultDashboardMutation,
  }
}
