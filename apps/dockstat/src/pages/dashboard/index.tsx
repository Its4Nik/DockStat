/**
 * Main dashboard listing page.
 *
 * Shows all dashboards fetched from the API and allows creating new ones.
 */

import { Badge, Button, Card, CardBody, Input } from "@dockstat/ui"
import { LayoutDashboard, Plus, Workflow } from "lucide-react"
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
    return <div className="p-6 text-muted-text">Loading dashboards…</div>
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary-text">Dashboards</h1>
        <p className="mt-1 text-sm text-muted-text">Manage your data visualization dashboards.</p>
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
          <Plus size={16} />
          Create
        </Button>
      </form>

      {/* Dashboard list */}
      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-card-default-border bg-card-flat-bg/40 py-16 text-center">
          <div className="rounded-full bg-card-default-bg p-3 text-muted-text">
            <LayoutDashboard size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-text">No dashboards yet</p>
            <p className="mt-1 text-xs text-muted-text">Create one above to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dash) => (
            <Card
              hoverable
              key={dash.id}
              onClick={() => navigate(`/dashboard/${dash.id}`)}
            >
              <CardBody>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold text-primary-text">{dash.label}</h3>
                  {dash.isDefault && (
                    <Badge
                      size="xs"
                      variant="primary"
                    >
                      Default
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-muted-text">
                  {dash.description || "No description"}
                </p>
                <div className="mt-3 flex items-center gap-3 border-t border-card-default-border pt-3 text-xs text-muted-text">
                  <span className="flex items-center gap-1">
                    <LayoutDashboard size={12} />
                    {dash.widgets.length} widgets
                  </span>
                  <span className="text-card-default-border">•</span>
                  <span className="flex items-center gap-1">
                    <Workflow size={12} />
                    {dash.dataPipe.nodes.length} data nodes
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
