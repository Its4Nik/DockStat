/**
 * WidgetFrame — shared chrome around any widget renderer.
 *
 * Renders the title bar, kind icon, live-data pulse, and edit-mode
 * controls (remove + configure), then delegates the body to the
 * registered widget renderer.
 */

import { cn } from "@sglara/cn"
import {
  Activity,
  BarChart3,
  Braces,
  Gauge as GaugeIcon,
  Grid3x3,
  Hexagon,
  type LucideIcon,
  Minus,
  Settings2,
  TrendingUp,
} from "lucide-react"
import { memo } from "react"
import type { DataPayload, PlacedWidget, WidgetConfig, WidgetDefinition } from "widgets/client"
import { getWidgetRenderer } from "./registry"

const KIND_ICON: Record<string, LucideIcon> = {
  "bar-chart": BarChart3,
  "bar-chart-horizontal": BarChart3,
  gauge: GaugeIcon,
  grid: Grid3x3,
  hexagon: Hexagon,
  "json-tree": Braces,
  progress: Minus,
  sparkline: TrendingUp,
  stat: Activity,
}

const KIND_LABEL: Record<string, string> = {
  "bar-chart": "Bar",
  gauge: "Gauge",
  heatmap: "Heatmap",
  honeycomb: "Honeycomb",
  "json-tree": "JSON",
  progress: "Progress",
  sparkline: "Spark",
  stat: "Stat",
}

interface WidgetFrameProps {
  placed: PlacedWidget
  widget?: WidgetDefinition
  payload: DataPayload | undefined
  previousValue?: number
  editMode: boolean
  /** Currently selected for in-place config */
  selected?: boolean
  onRemove?: () => void
  onConfigure?: () => void
  /** Optional override for the rendered body */
  children?: React.ReactNode
}

export const WidgetFrame = memo(function WidgetFrame({
  placed,
  widget,
  payload,
  previousValue,
  editMode,
  selected,
  onRemove,
  onConfigure,
  children,
}: WidgetFrameProps) {
  const Icon =
    (widget?.icon && KIND_ICON[widget.icon]) || (widget?.kind && KIND_ICON[widget.kind]) || Activity
  const kindLabel = widget?.kind ? (KIND_LABEL[widget.kind] ?? widget.kind) : "Widget"
  const hasData = !!payload

  const Renderer = getWidgetRenderer(widget?.kind)

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border bg-card-default-bg p-3 transition-all",
        selected
          ? "border-accent ring-1 ring-accent/30"
          : "border-card-default-border hover:border-accent/40"
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon
            className="shrink-0 text-muted-text"
            size={14}
          />
          <span className="truncate text-sm font-semibold text-primary-text">
            {widget?.label ?? "Unknown Widget"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Live pulse */}
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full transition-colors",
              hasData ? "animate-pulse bg-success" : "bg-muted-text/40"
            )}
            title={hasData ? "Receiving data" : "No data"}
          />
          {editMode && (
            <>
              {onConfigure && (
                <button
                  className="text-muted-text transition-colors hover:text-accent"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfigure()
                  }}
                  title="Configure"
                  type="button"
                >
                  <Settings2 size={13} />
                </button>
              )}
              {onRemove && (
                <button
                  className="text-muted-text transition-colors hover:text-error"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                  title="Remove widget"
                  type="button"
                >
                  <Minus size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Body — either children override or the registered renderer */}
      <div className="relative flex-1 overflow-hidden">
        {children ?? (
          <Renderer
            config={mergeConfig(widget, placed)}
            payload={payload}
            previousValue={previousValue}
          />
        )}
      </div>

      {/* Subtle footer with kind tag */}
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-text">
        <span>{kindLabel}</span>
        {placed.widgetId.startsWith("builtin.") ? <span>built-in</span> : null}
      </div>
    </div>
  )
}, arePropsEqual)

/**
 * Custom comparator for WidgetFrame memoization.
 *
 * Compares only the props that actually affect the rendered output,
 * not the function identities of `onRemove` / `onConfigure`
 * (which change every render of the parent). This is what stops every
 * tile from re-rendering when a single tile's data updates.
 */
function arePropsEqual(prev: WidgetFrameProps, next: WidgetFrameProps): boolean {
  return (
    prev.editMode === next.editMode &&
    prev.selected === next.selected &&
    prev.payload === next.payload &&
    prev.previousValue === next.previousValue &&
    prev.placed === next.placed &&
    prev.widget === next.widget
  )
}

/** Merge the widget definition's default config with per-instance overrides. */
export function mergeConfig(def: WidgetDefinition | undefined, placed: PlacedWidget): WidgetConfig {
  return { ...(def?.defaultConfig ?? {}), ...placed.config }
}
