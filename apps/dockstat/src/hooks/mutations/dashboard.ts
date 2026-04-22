import { eden } from "@dockstat/utils/react"
import { api, getAuthHeaders } from "@/lib/api"

export const useDashboardMutations = () => {
  const setDefaultDashboardMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"], ["fetchAllDashboards"]],
    mutationKey: ["setDefaultDashboard"],
    opts: {
      headers: getAuthHeaders(),
    },
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
    createDashboardMutation,
    deleteDashboardMutation,
    setDefaultDashboardMutation,
    updateDashboardMutation,
  }
}
