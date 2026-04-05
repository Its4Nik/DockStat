import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useDashboardMutations = () => {
  const createDashboardMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAllDashboards"]],
    mutationKey: ["createDashboard"],
    route: api.dashboards.post,
    toast: {
      errorTitle: (input) => `Could not create new Dashboard: ${input.name}`,
      successTitle: (input) => `Created new Dashboard: ${input.name}`,
    },
  })

  const updateDashboardMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAllDashboards"]],
    mutationKey: ["updateDashboard"],
    route: api.dashboards.patch,
    toast: {
      errorTitle: (input) => `Could not update Dashboard: ${input.name}`,
      successTitle: (input) => `Updated Dashboard: ${input.name}`,
    },
  })

  const deleteDashboardMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAllDashboards"]],
    mutationKey: ["deleteDashboard"],
    route: api.dashboards.delete,
    toast: {
      errorTitle: (input) => `Could not delete dashboard ${input.id}`,
      successTitle: (input) => `Deleted dashboard ${input.id}`,
    },
  })

  const setDefaultDashboardMutation = eden.useEdenMutation({
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
    createDashboardMutation,
    deleteDashboardMutation,
    setDefaultDashboardMutation,
    updateDashboardMutation,
  }
}
