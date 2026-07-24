/**
 * Specific dashboard view — displays widgets with live data and
 * supports drag-and-drop placement of prebuilt widget components.
 *
 * Layout:
 *   - Left sidebar: palette of available widgets (from DB)
 *   - Center: widget grid showing placed widgets with live data
 *   - Top bar: link to dataflow editor, save button
 */

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import type {
  DashboardDefinition,
  DataPayload,
  PlacedWidget,
  WidgetDefinition,
} from "widgets/client"
import { useWidgetData } from "widgets/client"
import { usePageHeading } from "@/hooks/useHeading"
import { useDashboardQueries } from "@/hooks/queries/dashboard"
import { useDashboardMutations } from "@/hooks/mutations/dashboard"

// ── Grid configuration ─────────────────────────────────────────────

const GRID_COLS = 12
const ROW_HEIGHT = 80

export default function DashboardPage() {
  const { id: dashboardId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── State ────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardDefinition | null>(null)

  usePageHeading(`Dashboard "${dashboard?.name || dashboard?.id}"`)


  // Live data subscription
  const {
    data: payloads,
    connected,
    evaluate,
  } = useWidgetData({
    dashboardId: dashboardId ?? "",
  })

  // ── Load dashboard + widget catalog ──────────────────────────────
  const { dashboardQuery, widgetsQuery } = useDashboardQueries(dashboardId)
  const { updateDashboardMutation } = useDashboardMutations()

  const availableWidgets = (widgetsQuery.data as WidgetDefinition[]) || []
  const loading = dashboardQuery.isLoading || widgetsQuery.isLoading
  const error = dashboardQuery.error?.message || widgetsQuery.error?.message || null
  const saving = updateDashboardMutation.isPending

  // Sync local state with query data
  useEffect(() => {
    if (dashboardQuery.data && !dashboard) {
      setDashboard(dashboardQuery.data as DashboardDefinition)
    }
  }, [dashboardQuery.data, dashboard])

  // ── Drag-and-drop: add widget to dashboard ───────────────────────
  const handleWidgetDrop = useCallback(
    (widget: WidgetDefinition) => {
      if (!dashboard) return

      const placed: PlacedWidget = {
        config: { ...widget.defaultConfig },
        gridLayout: {
          h: 3,
          i: `${widget.id}-${Date.now()}`,
          w: 4,
          x: 0,
          y: 0,
        },
        instanceId: `${widget.id}-${Date.now()}`,
        widgetId: widget.id,
      }

      // Update local state
      setDashboard({
        ...dashboard,
        widgets: [...dashboard.widgets, placed],
      })
    },
    [dashboard]
  )

  // ── Remove a placed widget ───────────────────────────────────────
  const handleRemoveWidget = useCallback(
    (instanceId: string) => {
      if (!dashboard) return
      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.filter((w) => w.instanceId !== instanceId),
      })
    },
    [dashboard]
  )

  // ── Save dashboard ───────────────────────────────────────────────
  const saveDashboard = async () => {
    if (!dashboard || !dashboardId) return

    try {
      await updateDashboardMutation.mutateAsync({
        body: { widgets: dashboard.widgets },
        params: { dashboardId },
      })
      // Refresh the dashboard data after successful save
      dashboardQuery.refetch()
    } catch (err) {
      console.error("Failed to save dashboard:", err)
    }
  }

  // ── Get payloads for a specific widget instance ──────────────────
  const getPayloadsForWidget = useCallback(
    (widget: WidgetDefinition): DataPayload[] => {
      if (!payloads) return []
      return payloads.filter((p) => widget.dataInputs.includes(p.key))
    },
    [payloads]
  )

  // ── Render ───────────────────────────────────────────────────────
  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading dashboard…</div>
  }

  if (!dashboard) {
    return <div className="p-6 text-red-500">Dashboard not found</div>
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{dashboard.label}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{connected ? "🟢 Live" : "🔴 Disconnected"}</span>
              <span>•</span>
              <span>{dashboard.widgets.length} widgets</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && <span className="text-sm text-red-500">{error}</span>}
            <button
              className={`px-3 py-1.5 text-sm border rounded ${
                editMode ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Done Editing" : "Edit"}
            </button>
            <button
              className="px-3 py-1.5 text-sm border rounded hover:bg-accent"
              onClick={() => evaluate()}
            >
              ↻ Refresh
            </button>
            <button
              className="px-3 py-1.5 text-sm border rounded hover:bg-accent"
              onClick={() => navigate(`/dataflow/${dashboardId}`)}
            >
              ⚡ Dataflow
            </button>
            {editMode && (
              <button
                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                disabled={saving}
                onClick={saveDashboard}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Widget Palette (edit mode only) */}
        {editMode && (
          <div className="w-56 border-r bg-background overflow-y-auto shrink-0 p-3">
            <h2 className="font-semibold text-sm mb-2">Widgets</h2>
            <p className="text-xs text-muted-foreground mb-3">Click to add to dashboard</p>
            <div className="space-y-2">
              {availableWidgets.map((widget) => (
                <button
                  className="w-full text-left px-3 py-2 border rounded hover:bg-accent transition-colors"
                  key={widget.id}
                  onClick={() => handleWidgetDrop(widget)}
                >
                  <div className="font-medium text-sm">{widget.label}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {widget.description}
                  </div>
                </button>
              ))}
              {availableWidgets.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No widgets registered. Import widgets first.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {dashboard.widgets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {editMode
                ? "Add widgets from the sidebar →"
                : "This dashboard has no widgets yet. Click Edit to add some."}
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridAutoRows: `${ROW_HEIGHT}px`,
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              }}
            >
              {dashboard.widgets.map((placed) => {
                const widgetDef = availableWidgets.find((w) => w.id === placed.widgetId)
                const widgetPayloads = widgetDef ? getPayloadsForWidget(widgetDef) : []

                return (
                  <WidgetCard
                    editMode={editMode}
                    key={placed.instanceId}
                    onRemove={() => handleRemoveWidget(placed.instanceId)}
                    payloads={widgetPayloads}
                    placed={placed}
                    widget={widgetDef}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Widget card ─────────────────────────────────────────────────────

interface WidgetCardProps {
  placed: PlacedWidget
  widget?: WidgetDefinition
  payloads: DataPayload[]
  editMode: boolean
  onRemove: () => void
}

function WidgetCard({ placed, widget, payloads, editMode, onRemove }: WidgetCardProps) {
  const layout = placed.gridLayout

  return (
    <div
      className="border rounded-lg bg-card p-3 overflow-hidden relative group"
      style={{
        gridColumn: `${layout.x + 1} / span ${layout.w}`,
        gridRow: `${layout.y + 1} / span ${layout.h}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm truncate">{widget?.label ?? "Unknown Widget"}</h3>
        {editMode && (
          <button
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity"
            onClick={onRemove}
          >
            ✕
          </button>
        )}
      </div>

      {/* Content: render based on widget kind */}
      <div className="text-sm">
        {payloads.length === 0 ? (
          <div className="text-muted-foreground text-xs">Waiting for data…</div>
        ) : (
          <div className="space-y-1">
            {payloads.map((p) => (
              <div
                className="flex justify-between"
                key={p.key}
              >
                <span className="text-muted-foreground">{p.key}</span>
                <span className="font-mono text-xs">
                  {typeof p.value === "object"
                    ? JSON.stringify(p.value).slice(0, 50)
                    : String(p.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit mode: show config note */}
      {editMode && widget && (
        <div className="absolute bottom-2 left-3 text-xs text-muted-foreground">
          {widget.dataInputs.length > 0
            ? `Inputs: ${widget.dataInputs.join(", ")}`
            : "No data inputs"}
        </div>
      )}
    </div>
  )
}
