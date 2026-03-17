import { eden } from "@dockstat/utils/react"
import { Dashboard } from "@dockstat/widget-handler"
import type { DashboardConfig } from "@dockstat/widget-handler/types"
import { useEffect, useState } from "react"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

export default function IndexPage() {
  usePageHeading("Home")
  //const navigate = useNavigate()
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)

  // Fetch additional settings to get the default dashboard
  const { data: config } = eden.useEdenQuery({
    route: api.db.config.get,
    queryKey: ["fetchAdditionalSettings"],
  })

  // Fetch all dashboards
  const { data: dashboards, isLoading: dashboardsLoading } = eden.useEdenQuery({
    route: api.dashboards.get,
    queryKey: ["fetchAllDashboards"],
  })

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflowX = html.style.overflowX
    const prevBodyOverflowX = body.style.overflowX

    html.style.overflowX = "clip"
    body.style.overflowX = "clip"

    return () => {
      html.style.overflowX = prevHtmlOverflowX
      body.style.overflowX = prevBodyOverflowX
    }
  }, [])

  // Load default dashboard when data is available
  useEffect(() => {
    if (!config || !dashboards || dashboardsLoading) return

    const defaultDashboardId = config.additionalSettings?.defaultDashboard

    if (defaultDashboardId) {
      const defaultDashboard = dashboards.find((d) => d.id === defaultDashboardId)
      if (defaultDashboard) {
        setDashboardConfig(defaultDashboard as DashboardConfig)
      }
    }
  }, [config, dashboards, dashboardsLoading])

  // Show loading state
  if (dashboardsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-text">Loading...</div>
      </div>
    )
  }

  // If no default dashboard is set, redirect to dashboards page or show default
  if (!dashboardConfig) {
    return (
      <div className="w-full min-w-0 max-w-full overflow-x-clip">
        <Dashboard
          initialConfig={{
            id: "my-dashboard",
            name: "My Dashboard",
            grid: { columns: 12, rowHeight: 60 },
            widgets: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            version: "1.0.0",
          }}
          onConfigChange={(config) => {
            console.log("Dashboard changed:", config)
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip">
      <Dashboard
        initialConfig={dashboardConfig}
        onConfigChange={(config) => {
          console.log("Dashboard changed:", config)
        }}
      />
    </div>
  )
}
