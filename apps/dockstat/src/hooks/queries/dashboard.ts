import { useEdenClient } from "@dockstat/utils/react"
import type { DashboardDefinition } from "widgets/client"
import { api } from "@/lib/api"

/**
 * Dashboard queries for fetching dashboards and widgets.
 */
export const useDashboardQueries = (dashboardId?: string) => {
  const eden = useEdenClient()

  // Fetch a specific dashboard by ID
  const dashboardQuery = eden.query({
    queryKey: ["fetchDashboard", dashboardId],
    route: api.widgets.dashboards[dashboardId ?? ""].get,
  })

  // Fetch all dashboards
  const dashboardsQuery = eden.query({
    queryKey: ["fetchAllDashboards"],
    route: api.widgets.dashboards.get,
  })

  // Fetch all available widgets
  const widgetsQuery = eden.query({
    queryKey: ["fetchAllWidgets"],
    route: api.widgets.widgets.get,
  })

  return {
    dashboardQuery,
    dashboardsQuery,
    widgetsQuery,
  }
}
