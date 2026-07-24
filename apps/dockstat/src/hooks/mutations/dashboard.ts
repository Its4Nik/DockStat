import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"
import type { DashboardDefinition } from "widgets/client"

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

  const createDashboardMutation = eden.mutate({
    invalidateQueries: [["fetchAllDashboards"]],
    mutationKey: ["createDashboard"],
    route: api.widgets.dashboards.post,
    toast: {
      errorTitle: () => "Could not create dashboard",
      successTitle: (input) => `Dashboard "${input?.label}" created`,
    },
  })

  const updateDashboardMutation = eden.mutateRoute({
    invalidateQueries: [["fetchDashboard"], ["fetchAllDashboards"]],
    mutationKey: ["updateDashboard"],
    routeBuilder: ({ dashboardId }: { dashboardId: string }) => api.widgets.dashboards({ dashboardId }).put,
    toast: {
      errorTitle: () => "Could not update dashboard",
      successTitle: () => "Dashboard updated",
    },
  })

  return {
    createDashboardMutation,
    setDefaultDashboardMutation,
    updateDashboardMutation,
  }
}
