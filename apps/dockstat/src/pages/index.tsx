import { usePageHeading } from "@/hooks/useHeading"
import { Dashboard } from "@dockstat/widget-handler"

export default function IndexPage() {
  usePageHeading("Home")

  return (
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
  )
}
