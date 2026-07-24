/**
 * Main dashboard listing page.
 *
 * Shows all dashboards fetched from the API and allows creating new ones.
 */

import { Badge, Button, Card, CardBody, Input } from "@dockstat/ui"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import type { DashboardDefinition } from "widgets/client"
import { useDashboardMutations } from "@/hooks/mutations/dashboard"
import { useDashboardQueries } from "@/hooks/queries/dashboard"
import { usePageHeading } from "@/hooks/useHeading"

export default function DashboardIndexPage() {
  usePageHeading("Dashboards")
  const navigate = useNavigate()

  const [newName, setNewName] = useState("")

  const { dashboardsQuery } = useDashboardQueries()
  const { createDashboardMutation } = useDashboardMutations()

  const dashboards = (dashboardsQuery.data as DashboardDefinition[]) || []
  const loading = dashboardsQuery.isLoading
  const error = dashboardsQuery.error?.message || null
  const creating = createDashboardMutation.isPending

  const createDashboard = async () => {
    if (!newName.trim()) return

    try {
      const dashboard: DashboardDefinition = await createDashboardMutation.mutateAsync({
        label: newName,
        name: newName.toLowerCase().replace(/\s+/g, "-"),
      })
      navigate(`/dashboard/${dashboard.id}`)
    } catch (err) {
      console.error("Failed to create dashboard:", err)
    }
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading dashboards…</div>
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboards</h1>
        <p className="text-muted-foreground">Manage your data visualization dashboards</p>
      </div>

      {error && (
        <Card
          className="mb-4"
          variant="error"
        >
          <CardBody>{error}</CardBody>
        </Card>
      )}

      {/* Create new dashboard */}
      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          createDashboard()
        }}
      >
        <Input
          className="flex-1"
          onChange={setNewName}
          placeholder="New dashboard name…"
          value={newName}
        />
        <Button
          disabled={!newName.trim()}
          loading={creating}
          type="submit"
          variant="primary"
        >
          <Plus />
          Create
        </Button>
      </form>

      {/* Dashboard list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboards.map((dash) => (
          <Card
            hoverable
            key={dash.id}
            onClick={() => navigate(`/dashboard/${dash.id}`)}
          >
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{dash.label}</h3>
                {dash.isDefault && (
                  <Badge
                    size="xs"
                    variant="primary"
                  >
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {dash.description || "No description"}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{dash.widgets.length} widgets</span>
                <span>•</span>
                <span>{dash.dataPipe.nodes.length} data nodes</span>
              </div>
            </CardBody>
          </Card>
        ))}

        {dashboards.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No dashboards yet. Create one above.
          </div>
        )}
      </div>
    </div>
  )
}
