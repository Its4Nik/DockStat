/**
 * Specific dashboard view — displays widgets with live data and
 * supports drag-and-drop placement of prebuilt widget components.
 *
 * Layout:
 *   - Left sidebar: palette of available widgets (from DB)
 *   - Center: widget grid showing placed widgets with live data
 *   - Top bar: link to dataflow editor, save button
 */

import { Badge, Button, Card, CardBody } from "@dockstat/ui"
import { Activity, Pencil, Plus, RefreshCw, Save, Trash2, Workflow } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import type {
  DashboardDefinition,
  DataPayload,
  PlacedWidget,
  WidgetDefinition,
} from "widgets/client"
import { useWidgetData } from "widgets/client"
import { useDashboardMutations } from "@/hooks/mutations/dashboard"
import { useDashboardQueries } from "@/hooks/queries/dashboard"
import { usePageHeading } from "@/hooks/useHeading"

// ── Grid configuration ─────────────────────────────────────────────

const GRID_COLS = 12
const ROW_HEIGHT = 80

/**
 * Key under which the per-instance input→output mapping is stored on a
 * `PlacedWidget.config`. The mapping lets the same widget definition
 * consume different data-pipe outputs on different dashboards (or even
 * different instances on the same dashboard).
 *
 * Shape: `{ [widgetInputKey]: dataPipeOutputKey }`.
 */
const DATA_INPUT_MAP_KEY = "dataInputMap"

export default function DashboardPage() {
  const { id: dashboardId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── State ────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardDefinition | null>(null)

  usePageHeading(
    dashboard?.label ? dashboard.label : `Dashboard "${dashboard?.name || dashboard?.id}"`
  )

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

  // ── Available output keys from the dashboard's data-pipe ──────────
  // These are produced by "output" nodes and are what widgets can
  // consume. We expose them so placed widgets can map their inputs to
  // any of these keys.
  const availableOutputKeys = useMemo(() => {
    if (!dashboard) return []
    return dashboard.dataPipe.nodes
      .filter((n) => n.type === "output" && typeof n.data.key === "string")
      .map((n) => n.data.key as string)
  }, [dashboard])

  // ── Add a widget to the dashboard ────────────────────────────────
  const handleWidgetDrop = useCallback(
    (widget: WidgetDefinition) => {
      if (!dashboard) return

      // Auto-map inputs to matching output keys when possible so the
      // widget shows data immediately without manual configuration.
      const autoMap: Record<string, string> = {}
      for (const input of widget.dataInputs) {
        if (availableOutputKeys.includes(input)) {
          autoMap[input] = input
        }
      }

      const placed: PlacedWidget = {
        config: { ...widget.defaultConfig, [DATA_INPUT_MAP_KEY]: autoMap },
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

      setDashboard({
        ...dashboard,
        widgets: [...dashboard.widgets, placed],
      })
    },
    [dashboard, availableOutputKeys]
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

  // ── Update a placed widget's config (e.g. input mapping) ─────────
  const handleUpdatePlaced = useCallback(
    (instanceId: string, patch: Record<string, unknown>) => {
      if (!dashboard) return
      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.map((w) =>
          w.instanceId === instanceId ? { ...w, config: { ...w.config, ...patch } } : w
        ),
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
  // Resolves each of the widget's declared `dataInputs` through the
  // per-instance `dataInputMap`, falling back to the input name itself
  // so existing dashboards keep working.
  const getPayloadsForWidget = useCallback(
    (widget: WidgetDefinition, placed: PlacedWidget): DataPayload[] => {
      if (!payloads) return []
      const inputMap =
        (placed.config[DATA_INPUT_MAP_KEY] as Record<string, string> | undefined) ?? {}
      const resolvedKeys = widget.dataInputs.map((input) => inputMap[input] ?? input)
      return payloads.filter((p) => resolvedKeys.includes(p.key))
    },
    [payloads]
  )

  // ── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <Card variant="flat">
          <CardBody>Loading dashboard…</CardBody>
        </Card>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <Card variant="error">
          <CardBody>Dashboard not found</CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <Card variant="flat">
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-primary-text">{dashboard.label}</h2>
              <Badge
                size="xs"
                variant={connected ? "success" : "error"}
              >
                <span className="mr-1">{connected ? "●" : "○"}</span>
                {connected ? "Live" : "Disconnected"}
              </Badge>
              <Badge
                size="xs"
                variant="secondary"
              >
                {dashboard.widgets.length} widgets
              </Badge>
            </div>
            {dashboard.description && (
              <p className="text-sm text-muted-text">{dashboard.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {error && <span className="text-sm text-error">{error}</span>}
            <Button
              onClick={() => evaluate()}
              size="sm"
              variant="outline"
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate(`/dataflow/${dashboardId}`)}
              size="sm"
              variant="outline"
            >
              <Workflow size={14} />
              Dataflow
            </Button>
            <Button
              onClick={() => setEditMode(!editMode)}
              size="sm"
              variant={editMode ? "primary" : "outline"}
            >
              <Pencil size={14} />
              {editMode ? "Done" : "Edit"}
            </Button>
            {editMode && (
              <Button
                disabled={saving}
                loading={saving}
                onClick={saveDashboard}
                size="sm"
                variant="primary"
              >
                <Save size={14} />
                {saving ? "Saving…" : "Save"}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Body */}
      <div className="flex gap-4">
        {/* Widget Palette (edit mode only) */}
        {editMode && (
          <Card
            className="w-64 shrink-0 self-start"
            variant="flat"
          >
            <CardBody>
              <div className="mb-3 flex items-center gap-2">
                <Plus
                  className="text-accent"
                  size={16}
                />
                <h3 className="text-sm font-semibold text-primary-text">Widgets</h3>
              </div>
              <p className="mb-3 text-xs text-muted-text">Click to add to the dashboard</p>
              <div className="space-y-2">
                {availableWidgets.map((widget) => (
                  <button
                    className="w-full rounded-md border border-card-default-border bg-card-default-bg px-3 py-2 text-left transition-colors hover:border-accent hover:bg-card-elevated-bg"
                    key={widget.id}
                    onClick={() => handleWidgetDrop(widget)}
                    type="button"
                  >
                    <div className="text-sm font-medium text-primary-text">{widget.label}</div>
                    <div className="line-clamp-1 text-xs text-muted-text">{widget.description}</div>
                    {widget.dataInputs.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {widget.dataInputs.map((input) => (
                          <Badge
                            key={input}
                            outlined
                            size="xs"
                            variant="secondary"
                          >
                            in: {input}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
                {availableWidgets.length === 0 && (
                  <p className="text-xs text-muted-text">
                    No widgets registered. Import widgets first.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Widget Grid */}
        <div className="flex-1 min-w-0">
          {dashboard.widgets.length === 0 ? (
            <Card variant="flat">
              <CardBody className="flex items-center justify-center gap-2 py-16 text-muted-text">
                <Activity size={18} />
                {editMode
                  ? "Add widgets from the sidebar →"
                  : "This dashboard has no widgets yet. Click Edit to add some."}
              </CardBody>
            </Card>
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
                const widgetPayloads = widgetDef ? getPayloadsForWidget(widgetDef, placed) : []

                return (
                  <WidgetCard
                    availableOutputKeys={availableOutputKeys}
                    editMode={editMode}
                    key={placed.instanceId}
                    onRemove={() => handleRemoveWidget(placed.instanceId)}
                    onUpdateConfig={(patch) => handleUpdatePlaced(placed.instanceId, patch)}
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
  availableOutputKeys: string[]
  onRemove: () => void
  onUpdateConfig: (patch: Record<string, unknown>) => void
}

function WidgetCard({
  placed,
  widget,
  payloads,
  editMode,
  availableOutputKeys,
  onRemove,
  onUpdateConfig,
}: WidgetCardProps) {
  const layout = placed.gridLayout
  const inputMap = (placed.config[DATA_INPUT_MAP_KEY] as Record<string, string> | undefined) ?? {}

  const setInputMapping = (input: string, outputKey: string) => {
    onUpdateConfig({ [DATA_INPUT_MAP_KEY]: { ...inputMap, [input]: outputKey } })
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-card-default-border bg-card-default-bg p-3 transition-colors group hover:border-accent"
      style={{
        gridColumn: `${layout.x + 1} / span ${layout.w}`,
        gridRow: `${layout.y + 1} / span ${layout.h}`,
      }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-primary-text">
          {widget?.label ?? "Unknown Widget"}
        </h3>
        {editMode && (
          <button
            className="text-muted-text transition-colors hover:text-error"
            onClick={onRemove}
            title="Remove widget"
            type="button"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content: live payload values */}
      <div className="space-y-1 text-sm">
        {payloads.length === 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-text">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-muted-text" />
            Waiting for data…
          </div>
        ) : (
          payloads.map((p) => (
            <div
              className="flex items-center justify-between gap-2"
              key={p.key}
            >
              <Badge
                outlined
                size="xs"
                variant="secondary"
              >
                {p.key}
              </Badge>
              <span className="truncate font-mono text-xs text-secondary-text">
                {typeof p.value === "object"
                  ? JSON.stringify(p.value).slice(0, 50)
                  : String(p.value)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Edit mode: input mapper */}
      {editMode && widget && (
        <div className="mt-3 border-t border-card-default-border pt-2">
          {widget.dataInputs.length === 0 ? (
            <p className="text-xs text-muted-text">No data inputs</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-text">
                Map inputs to data-pipe outputs
              </p>
              {widget.dataInputs.map((input) => {
                const mapped = inputMap[input] ?? ""
                return (
                  <div
                    className="flex items-center gap-2"
                    key={input}
                  >
                    <span className="w-1/3 truncate text-xs text-secondary-text">{input}</span>
                    <select
                      className="flex-1 rounded-md border border-select-default-border bg-card-flat-bg px-2 py-1 text-xs text-select-default-text focus:border-select-default-focus-border focus:outline-none focus:ring-1 focus:ring-select-default-focus-ring"
                      onChange={(e) => setInputMapping(input, e.target.value)}
                      value={mapped}
                    >
                      <option value="">— not connected —</option>
                      {availableOutputKeys.map((key) => (
                        <option
                          key={key}
                          value={key}
                        >
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
              {availableOutputKeys.length === 0 && (
                <p className="text-xs text-muted-text">
                  No outputs defined yet. Add Output nodes in the{" "}
                  <span className="text-accent">Dataflow</span> editor.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
