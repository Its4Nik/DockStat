/**
 * Widget renderer registry.
 *
 * Maps a `WidgetDefinition.kind` to the React component that should
 * render it. Falls back to a JSON tree when the kind is unknown so the
 * dashboard never shows a blank tile.
 *
 * Each renderer receives:
 *   - `config`: the merged widget config (defaultConfig + per-instance overrides)
 *   - `payload`: the resolved DataPayload for the widget's primary input
 *   - `previousValue`: optional prior numeric value (for trend deltas)
 */

import type { ComponentType } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"
import { BarChart } from "./BarChart"
import { Gauge } from "./Gauge"
import { Heatmap } from "./Heatmap"
import { Honeycomb } from "./Honeycomb"
import { JsonTree } from "./JsonTree"
import { Progress } from "./Progress"
import { Sparkline } from "./Sparkline"
import { Stat } from "./Stat"

export interface WidgetRendererProps {
  config: WidgetConfig
  payload: DataPayload | undefined
  previousValue?: number
}

export type WidgetRenderer = ComponentType<WidgetRendererProps>

export const WIDGET_RENDERERS: Record<string, WidgetRenderer> = {
  "bar-chart": BarChart,
  gauge: Gauge,
  heatmap: Heatmap,
  honeycomb: Honeycomb,
  "json-tree": JsonTree,
  progress: Progress,
  sparkline: Sparkline,
  stat: Stat,
}

/**
 * Resolve the renderer component for a widget kind. Returns the
 * JsonTree fallback when the kind isn't registered so unknown widget
 * types still render something useful (their raw payload).
 */
export function getWidgetRenderer(kind: string | undefined): WidgetRenderer {
  if (kind && WIDGET_RENDERERS[kind]) return WIDGET_RENDERERS[kind]
  return JsonTree
}
