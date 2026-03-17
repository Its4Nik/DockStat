import { Badge, Button, Card, CardBody, Input, Modal } from "@dockstat/ui"
import { eden } from "@dockstat/utils/react"
import { Edit2, LayoutDashboard, Plus, Star, Trash2 } from "lucide-react"
import { useState } from "react"
import { useDashboardMutations } from "@/hooks/mutations/dashboard"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

/**
 * Dashboard Browser Page
 *
 * Allows users to browse, create, edit, and delete dashboards.
 * Also supports setting a default dashboard.
 */
export default function DashboardsPage() {
  usePageHeading("Dashboards")

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newDashboardName, setNewDashboardName] = useState("")
  const [editingDashboard, setEditingDashboard] = useState<{
    id: string
    name: string
  } | null>(null)

  // Fetch all dashboards
  const { data: dashboards, isLoading } = eden.useEdenQuery({
    route: api.dashboards.get,
    queryKey: ["fetchAllDashboards"],
  })

  // Fetch additional settings to get the default dashboard
  const { data: config } = eden.useEdenQuery({
    route: api.db.config.get,
    queryKey: ["fetchAdditionalSettings"],
  })

  const { createDashboardMutation, deleteDashboardMutation, setDefaultDashboardMutation } =
    useDashboardMutations()

  const defaultDashboardId = config?.additionalSettings?.defaultDashboard

  const handleCreateDashboard = () => {
    if (!newDashboardName.trim()) return

    createDashboardMutation.mutate({
      id: `dashboard-${Date.now()}`,
      name: newDashboardName.trim(),
      grid: { columns: 12, rowHeight: 60, gap: 16, compact: true },
      widgets: [],
      settings: { refreshInterval: 30000, editMode: true, showBorders: true },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    })

    setNewDashboardName("")
    setCreateModalOpen(false)
  }

  const handleSetDefault = (dashboardId: string) => {
    // Toggle: if already default, clear it
    if (defaultDashboardId === dashboardId) {
      setDefaultDashboardMutation.mutate({ dashboardId: null })
    } else {
      setDefaultDashboardMutation.mutate({ dashboardId })
    }
  }

  const handleDeleteDashboard = (dashboardId: string) => {
    if (window.confirm("Are you sure you want to delete this dashboard?")) {
      deleteDashboardMutation.mutate({ id: dashboardId })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-text">Loading dashboards...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary-text">Dashboards</h1>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Dashboard
        </Button>
      </div>

      {dashboards && dashboards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => {
            const isDefault = defaultDashboardId === dashboard.id

            return (
              <Card
                key={dashboard.id}
                className={`relative ${isDefault ? "ring-2 ring-primary" : ""}`}
                hoverable
              >
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-primary-text">
                          {dashboard.name}
                        </h3>
                        {isDefault && (
                          <Badge variant="primary" size="sm">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-text mb-2">
                        {dashboard.widgets?.length || 0} widgets
                      </p>
                      <p className="text-xs text-muted-text">
                        Updated: {new Date(dashboard.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div title={isDefault ? "Remove as default" : "Set as default"}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(dashboard.id)}
                        >
                          <Star
                            className={`w-4 h-4 ${isDefault ? "fill-primary text-primary" : ""}`}
                          />
                        </Button>
                      </div>
                      <div title="Edit name">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingDashboard({
                              id: dashboard.id,
                              name: dashboard.name,
                            })
                          }
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div title="Delete dashboard">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDashboard(dashboard.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-muted-text">
          <LayoutDashboard className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg mb-2">No dashboards yet</p>
          <p className="text-sm mb-4">Create your first dashboard to get started</p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Dashboard
          </Button>
        </div>
      )}

      {/* Create Dashboard Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Dashboard"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="block text-sm font-medium text-primary-text mb-2">Dashboard Name</p>
            <Input
              type="text"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e)}
              placeholder="My Dashboard"
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-main-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDashboard} disabled={!newDashboardName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Dashboard Name Modal */}
      <Modal
        open={!!editingDashboard}
        onClose={() => setEditingDashboard(null)}
        title="Edit Dashboard Name"
        size="sm"
      >
        {editingDashboard && (
          <EditDashboardForm
            dashboard={editingDashboard}
            onClose={() => setEditingDashboard(null)}
          />
        )}
      </Modal>
    </div>
  )
}

/**
 * Edit Dashboard Name Form
 */
function EditDashboardForm({
  dashboard,
  onClose,
}: {
  dashboard: { id: string; name: string }
  onClose: () => void
}) {
  const [name, setName] = useState(dashboard.name)
  const { updateDashboardMutation } = useDashboardMutations()

  const handleSave = () => {
    if (!name.trim()) return

    updateDashboardMutation.mutate({
      id: dashboard.id,
      name: name.trim(),
      grid: { columns: 12, rowHeight: 60 },
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    })

    onClose()
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="block text-sm font-medium text-primary-text mb-2">Dashboard Name</p>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e)}
          placeholder="Dashboard name"
          className="w-full px-3 py-2 rounded-lg border border-border-color bg-main-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </div>
  )
}
