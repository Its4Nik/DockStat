import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"
import type { DashboardDefinition } from "widgets/client"

/**
 * Dashboard queries for fetching dashboards and widgets.
 */
export const useDashboardQueries = (dashboardId?: string) => {
  const eden = useContext(EdenClientContext)

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
