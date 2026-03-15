import { Dashboard } from "@dockstat/widget-handler"
import { useEffect } from "react"
import { usePageHeading } from "@/hooks/useHeading"

export default function IndexPage() {
  usePageHeading("Home")

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
