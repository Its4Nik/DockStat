/**
 * Specific dashboard view — displays widgets with live data and
 * supports drag-and-drop placement + resize of prebuilt widget
 * components.
 *
 * Layout:
 *   - Top toolbar: title, status, action buttons
 *   - Body:
 *       • edit mode  → widget palette (left) + grid (center) + config panel (right)
 *       • view mode  → grid only, fills available space
 *
 * Uses react-grid-layout v2 for drag/resize. Width is observed via
 * the `useContainerWidth` hook (the v2 replacement for the WidthProvider HOC).
 *
 * ── Performance notes ──────────────────────────────────────────────
 * The WebSocket data hook (`useWidgetData`) re-subscribes whenever its
 * `options.onUpdate` callback identity changes. We therefore MUST NOT
 * pass an inline closure to it — doing so causes a re-subscribe storm
 * that cascades into "Maximum update depth exceeded". Instead, we:
 *   1. Omit `onUpdate` entirely from `useWidgetData`.
 *   2. Derive "previous values" for trend displays from `payloads` via
 *      a ref + useEffect keyed on `payloads` (stable deps).
 *
 * Drag/resize performance: RGL fires `onLayoutChange` on every tick.
 * We keep an in-flight `dragLayout` state for live feedback, and only
 * commit into the heavier `dashboard.widgets[*].gridLayout` on drag/resize stop.
 */

import { Button } from "@dockstat/ui"
import { cn } from "@sglara/cn"
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import {
  Activity,
  AlertCircle,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Workflow,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import type {
  DashboardDefinition,
  DataPayload,
  PlacedWidget,
  WidgetDefinition,
} from "widgets/client"
import { useWidgetData } from "widgets/client"
import { WidgetConfigPanel } from "@/components/widgets/WidgetConfigPanel"
import { WidgetFrame } from "@/components/widgets/WidgetFrame"
import { useDashboardMutations } from "@/hooks/mutations/dashboard"
import { useDashboardQueries } from "@/hooks/queries/dashboard"
import { usePageHeading } from "@/hooks/useHeading"

// ── Grid configuration ─────────────────────────────────────────────

const ROW_HEIGHT = 60
const GRID_MARGIN: [number, number] = [8, 8]

/**
 * Key under which the per-instance input→output mapping is stored on a
 * `PlacedWidget.config`. The mapping lets the same widget definition
 * consume different data-pipe outputs on different dashboards (or even
 * different instances on the same dashboard).
 *
 * Shape: `{ [widgetInputKey]: dataPipeOutputKey }`.
 */
const DATA_INPUT_MAP_KEY = "dataInputMap"

// Minimal layout-item shape RGL passes back to callbacks. Keeping it
// local avoids importing RGL's `Layout` type (which is `readonly`)
// into our widget type surface.
interface RGLLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

export default function DashboardPage() {
  const { id: dashboardId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── State ────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardDefinition | null>(null)
  const [configInstanceId, setConfigInstanceId] = useState<string | null>(null)
  // In-flight drag/resize layout. We update this on every tick for
  // smooth live feedback, then commit to `dashboard.widgets[*].gridLayout`
  // only on drag/resize stop. Kept in state (not ref) so RGL re-renders
  // the moved tile live.
  const [liveLayout, setLiveLayout] = useState<Map<string, RGLLayoutItem> | null>(null)

  // Track previous payload values per output-key so stat widgets can
  // render a trend delta. Keyed by output key. Held in a ref because
  // we don't want trend tracking itself to trigger re-renders.
  const previousValuesRef = useRef<Record<string, number>>({})

  usePageHeading(
    dashboard?.label ? dashboard.label : `Dashboard "${dashboard?.name || dashboard?.id}"`
  )

  // IMPORTANT: no `onUpdate` here — see file header. We derive previous
  // values from `payloads` below via useEffect (stable deps).
  const {
    data: payloads,
    connected,
    evaluate,
  } = useWidgetData({
    dashboardId: dashboardId ?? "",
  })

  // ── Track previous values for trend displays (stable effect) ──────
  useEffect(() => {
    if (!payloads) return
    for (const p of payloads) {
      const v = p.value
      if (typeof v === "number") {
        previousValuesRef.current[p.key] = v
      } else if (v && typeof v === "object") {
        const o = v as Record<string, unknown>
        if (typeof o.value === "number") previousValuesRef.current[p.key] = o.value
      }
    }
  }, [payloads])

  // ── Load dashboard + widget catalog ──────────────────────────────
  const { dashboardQuery, widgetsQuery } = useDashboardQueries(dashboardId)
  const { updateDashboardMutation } = useDashboardMutations()

  const availableWidgets = (widgetsQuery.data as WidgetDefinition[]) || []
  const loading = dashboardQuery.isLoading || widgetsQuery.isLoading
  const error = dashboardQuery.error?.message || widgetsQuery.error?.message || null
  const saving = updateDashboardMutation.isPending

  // Sync local state with query data once
  useEffect(() => {
    if (dashboardQuery.data && !dashboard) {
      setDashboard(dashboardQuery.data as DashboardDefinition)
    }
  }, [dashboardQuery.data, dashboard])

  // ── Memoized lookups ─────────────────────────────────────────────
  // widgetId → definition. Avoids an O(n) `.find` per tile per render.
  const widgetDefMap = useMemo(() => {
    const m = new Map<string, WidgetDefinition>()
    for (const w of availableWidgets) m.set(w.id, w)
    return m
  }, [availableWidgets])

  // Available output keys produced by the dashboard's data-pipe.
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

      // Auto-map inputs to matching output keys when possible
      const autoMap: Record<string, string> = {}
      for (const input of widget.dataInputs) {
        if (availableOutputKeys.includes(input)) {
          autoMap[input] = input
        }
      }

      const instanceId = `${widget.id}-${Date.now()}`
      const placed: PlacedWidget = {
        config: { ...widget.defaultConfig, [DATA_INPUT_MAP_KEY]: autoMap },
        gridLayout: {
          h: 4,
          i: instanceId,
          minH: 2,
          minW: 2,
          w: 4,
          x: 0,
          y: Infinity, // RGL places at the bottom
        },
        instanceId,
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
      if (configInstanceId === instanceId) setConfigInstanceId(null)
    },
    [dashboard, configInstanceId]
  )

  // ── Update a placed widget's config ──────────────────────────────
  const handleUpdateConfig = useCallback(
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

  // ── Layout changes ───────────────────────────────────────────────
  // RGL fires onLayoutChange on every drag/resize tick. We split:
  //   - onLayoutChange → update lightweight `liveLayout` for smooth feedback
  //   - onDragStop / onResizeStop → commit into dashboard.widgets
  const handleLayoutChange = useCallback((layout: ReadonlyArray<RGLLayoutItem>) => {
    setLiveLayout(new Map(layout.map((l) => [l.i, l])))
  }, [])

  const commitLayout = useCallback(
    (layout: ReadonlyArray<RGLLayoutItem>) => {
      setLiveLayout(null)
      if (!dashboard) return
      const byId = new Map(layout.map((l) => [l.i, l]))
      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.map((w) => {
          const l = byId.get(w.instanceId)
          if (!l) return w
          return {
            ...w,
            gridLayout: {
              ...w.gridLayout,
              h: l.h,
              w: l.w,
              x: l.x,
              y: l.y,
            },
          }
        }),
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
      dashboardQuery.refetch()
    } catch (err) {
      console.error("Failed to save dashboard:", err)
    }
  }

  // ── Resolve payloads + previous value for a widget instance ──────
  const getPayloadForWidget = useCallback(
    (widget: WidgetDefinition, placed: PlacedWidget): DataPayload | undefined => {
      if (!payloads) return undefined
      const inputMap =
        (placed.config[DATA_INPUT_MAP_KEY] as Record<string, string> | undefined) ?? {}
      const primaryInput = widget.dataInputs[0]
      if (!primaryInput) return undefined
      const resolvedKey = inputMap[primaryInput] ?? primaryInput
      return payloads.find((p) => p.key === resolvedKey)
    },
    [payloads]
  )

  const getPreviousValueForWidget = useCallback(
    (widget: WidgetDefinition, placed: PlacedWidget) => {
      const inputMap =
        (placed.config[DATA_INPUT_MAP_KEY] as Record<string, string> | undefined) ?? {}
      const primaryInput = widget.dataInputs[0]
      if (!primaryInput) return undefined
      const resolvedKey = inputMap[primaryInput] ?? primaryInput
      return previousValuesRef.current[resolvedKey]
    },
    []
  )

  // ── Container width (for react-grid-layout v2) ───────────────────
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1280 })

  // ── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-card-default-border bg-card-flat-bg px-4 py-3 text-sm text-muted-text">
          Loading dashboard…
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          Dashboard not found.
        </div>
      </div>
    )
  }

  const configPlaced = dashboard.widgets.find((w) => w.instanceId === configInstanceId) ?? null
  const configWidget = configPlaced ? widgetDefMap.get(configPlaced.widgetId) : undefined

  // Effective layout = committed gridLayout overridden by any in-flight drag
  const effectiveLayout = dashboard.widgets.map((w) => {
    const live = liveLayout?.get(w.instanceId)
    return {
      h: live?.h ?? w.gridLayout.h,
      i: w.instanceId,
      minH: w.gridLayout.minH ?? 2,
      minW: w.gridLayout.minW ?? 2,
      w: live?.w ?? w.gridLayout.w,
      x: live?.x ?? w.gridLayout.x,
      y: live?.y ?? w.gridLayout.y,
    }
  })

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3 pb-4">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <DashboardToolbar
        connected={connected}
        dashboard={dashboard}
        editMode={editMode}
        error={error}
        onDataflow={() => navigate(`/dataflow/${dashboardId}`)}
        onEditToggle={() => setEditMode(!editMode)}
        onRefresh={() => evaluate()}
        onSave={saveDashboard}
        saving={saving}
      />

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Palette (edit mode only) */}
        {editMode && (
          <aside className="flex w-64 shrink-0 flex-col self-stretch overflow-hidden rounded-lg border border-card-default-border bg-card-flat-bg shadow-xl">
            <div className="border-b border-card-default-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Plus
                  className="text-accent"
                  size={16}
                />
                <h3 className="text-sm font-semibold text-primary-text">Widgets</h3>
              </div>
              <p className="mt-1 text-xs text-muted-text">Click to add to the dashboard.</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {availableWidgets.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted-text">
                  No widgets registered. Import widgets first.
                </p>
              ) : (
                availableWidgets.map((widget) => (
                  <button
                    className={cn(
                      "group relative flex w-full items-start gap-2 overflow-hidden rounded-md border border-card-default-border bg-card-default-bg px-3 py-2 text-left transition-all",
                      "hover:border-accent hover:bg-card-elevated-bg",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    )}
                    key={widget.id}
                    onClick={() => handleWidgetDrop(widget)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-0.5 bg-accent opacity-60 transition-opacity group-hover:opacity-100"
                    />
                    <span className="min-w-0 flex-1 pl-1">
                      <span className="block text-sm font-medium text-primary-text">
                        {widget.label}
                      </span>
                      <span className="line-clamp-2 block text-xs text-muted-text">
                        {widget.description}
                      </span>
                      {widget.dataInputs.length > 0 && (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {widget.dataInputs.map((input) => (
                            <span
                              className="inline-block rounded border border-badge-secondary-outlined-border px-1 py-0.5 text-[10px] font-medium text-badge-secondary-outlined-text"
                              key={input}
                            >
                              in: {input}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Grid */}
        <div
          className={cn(
            "min-w-0 flex-1 overflow-y-auto rounded-lg border border-card-default-border bg-card-flat-bg/40 p-2",
            editMode ? "shadow-xl" : ""
          )}
          ref={containerRef}
        >
          {dashboard.widgets.length === 0 ? (
            <EmptyState editMode={editMode} />
          ) : mounted ? (
            <ResponsiveGridLayout
              className="layout"
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              dragConfig={{ bounded: false, enabled: editMode, threshold: 3 }}
              layouts={{
                lg: effectiveLayout,
                md: effectiveLayout,
                sm: effectiveLayout,
                xs: effectiveLayout,
                xxs: effectiveLayout,
              }}
              margin={GRID_MARGIN}
              onDragStop={commitLayout}
              onLayoutChange={handleLayoutChange}
              onResizeStop={commitLayout}
              resizeConfig={{ enabled: editMode, handles: ["se", "sw", "ne", "nw"] }}
              rowHeight={ROW_HEIGHT}
              width={width}
            >
              {dashboard.widgets.map((placed) => {
                const widgetDef = widgetDefMap.get(placed.widgetId)
                const payload = widgetDef ? getPayloadForWidget(widgetDef, placed) : undefined
                const previousValue = widgetDef
                  ? getPreviousValueForWidget(widgetDef, placed)
                  : undefined

                return (
                  <div
                    className="overflow-hidden"
                    key={placed.instanceId}
                  >
                    <WidgetFrame
                      editMode={editMode}
                      onConfigure={
                        editMode ? () => setConfigInstanceId(placed.instanceId) : undefined
                      }
                      onRemove={editMode ? () => handleRemoveWidget(placed.instanceId) : undefined}
                      payload={payload}
                      placed={placed}
                      previousValue={previousValue}
                      selected={configInstanceId === placed.instanceId}
                      widget={widgetDef}
                    />
                  </div>
                )
              })}
            </ResponsiveGridLayout>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-text">
              Preparing canvas…
            </div>
          )}
        </div>

        {/* Config panel (edit mode + a widget selected) */}
        {editMode && configPlaced && (
          <WidgetConfigPanel
            availableOutputKeys={availableOutputKeys}
            onChange={(patch) => handleUpdateConfig(configPlaced.instanceId, patch)}
            onClose={() => setConfigInstanceId(null)}
            placed={configPlaced}
            widget={configWidget}
          />
        )}
      </div>
    </div>
  )
}

// ── Toolbar (control bar) ───────────────────────────────────────────

interface DashboardToolbarProps {
  dashboard: DashboardDefinition
  editMode: boolean
  connected: boolean
  error: string | null
  saving: boolean
  onEditToggle: () => void
  onSave: () => void
  onRefresh: () => void
  onDataflow: () => void
}

function DashboardToolbar({
  dashboard,
  editMode,
  connected,
  error,
  saving,
  onEditToggle,
  onSave,
  onRefresh,
  onDataflow,
}: DashboardToolbarProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-card-default-border bg-card-default-bg px-4 py-2.5 shadow-xl">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <LayoutGrid size={16} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-primary-text">{dashboard.label}</h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                connected ? "bg-success/15 text-success" : "bg-error/15 text-error"
              )}
            >
              <span>{connected ? "●" : "○"}</span>
              {connected ? "Live" : "Off"}
            </span>
          </div>
          <p className="truncate text-xs text-muted-text">
            {dashboard.widgets.length} widgets · {dashboard.dataPipe.nodes.length} data nodes
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {error && (
          <span
            className="flex items-center gap-1.5 rounded-md border border-error/40 bg-error/10 px-2 py-1 text-xs text-error"
            title={error}
          >
            <AlertCircle size={12} />
            <span className="max-w-40 truncate">{error}</span>
          </span>
        )}
        <ToolbarButton
          icon={<RefreshCw size={14} />}
          label="Refresh"
          onClick={onRefresh}
          variant="ghost"
        />
        <ToolbarButton
          icon={<Workflow size={14} />}
          label="Dataflow"
          onClick={onDataflow}
          variant="ghost"
        />
        <ToolbarButton
          icon={<Pencil size={14} />}
          label={editMode ? "Done" : "Edit"}
          onClick={onEditToggle}
          variant={editMode ? "primary" : "outline"}
        />
        {editMode && (
          <Button
            disabled={saving}
            loading={saving}
            onClick={onSave}
            size="sm"
            variant="primary"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save"}
          </Button>
        )}
      </div>
    </header>
  )
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant: "ghost" | "outline" | "primary"
}

function ToolbarButton({ icon, label, onClick, variant }: ToolbarButtonProps) {
  const variantClass = {
    ghost: "text-secondary-text hover:bg-card-flat-bg hover:text-primary-text",
    outline:
      "border border-button-outline-border text-button-outline-text hover:bg-button-outline-hover-bg",
    primary: "bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover-bg",
  }[variant]

  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        variantClass
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

// ── Empty state ─────────────────────────────────────────────────────

function EmptyState({ editMode }: { editMode: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="rounded-full bg-card-default-bg p-3 text-muted-text">
        <Activity size={22} />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-secondary-text">No widgets yet</p>
        <p className="mt-1 text-xs text-muted-text">
          {editMode
            ? "Add widgets from the sidebar."
            : "This dashboard has no widgets yet. Click Edit to add some."}
        </p>
      </div>
    </div>
  )
}
