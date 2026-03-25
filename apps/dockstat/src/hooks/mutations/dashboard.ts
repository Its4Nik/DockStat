import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useDashboardMutations = () => {
  const createDashboardMutation = eden.useEdenMutation({
    mutationKey: ["createDashboard"],
    route: api.dashboards.post,
    invalidateQueries: [["fetchAllDashboards"]],
    toast: {
      successTitle: (input) => `Created new Dashboard: ${input.name}`,
      errorTitle: (input) => `Could not create new Dashboard: ${input.name}`,
    },
  })

  const updateDashboardMutation = eden.useEdenMutation({
    mutationKey: ["updateDashboard"],
    route: api.dashboards.patch,
    invalidateQueries: [["fetchAllDashboards"]],
    toast: {
      successTitle: (input) => `Updated Dashboard: ${input.name}`,
      errorTitle: (input) => `Could not update Dashboard: ${input.name}`,
    },
  })

  const deleteDashboardMutation = eden.useEdenMutation({
    mutationKey: ["deleteDashboard"],
    route: api.dashboards.delete,
    invalidateQueries: [["fetchAllDashboards"]],
    toast: {
      successTitle: (input) => `Deleted dashboard ${input.id}`,
      errorTitle: (input) => `Could not delete dashboard ${input.id}`,
    },
  })

  const setDefaultDashboardMutation = eden.useEdenMutation({
    mutationKey: ["setDefaultDashboard"],
    route: api.db.config.defaultDashboard.post,
    invalidateQueries: [["fetchAdditionalSettings"], ["fetchAllDashboards"]],
    toast: {
      successTitle: (input) =>
        input.dashboardId
          ? `Set default dashboard to ${input.dashboardId}`
          : "Cleared default dashboard",
      errorTitle: () => "Could not set default dashboard",
    },
  })

  return {
    createDashboardMutation,
    updateDashboardMutation,
    deleteDashboardMutation,
    setDefaultDashboardMutation,
  }
}
