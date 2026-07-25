/**
 * Stat widget — a single big-number tile.
 *
 * Renders a primary numeric value with optional prefix/suffix/unit,
 * a small label, threshold-colored value, and a subtle trend delta
 * when the previous value is provided in the payload history.
 */

import { cn } from "@sglara/cn"
import { TrendingDown, TrendingUp } from "lucide-react"
import { useMemo } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"
import {
  extractScalar,
  formatValue,
  type NumberFormat,
  type Threshold,
  thresholdColor,
} from "./shared"

interface StatConfig {
  unit?: string
  decimals?: number
  label?: string
  prefix?: string
  suffix?: string
  thresholds?: Threshold[]
  showTrend?: boolean
  format?: NumberFormat
}

interface StatProps {
  config: WidgetConfig
  payload: DataPayload | undefined
  previousValue?: number
}

export function Stat({ config, payload, previousValue }: StatProps) {
  const cfg = config as StatConfig
  const format = cfg.format ?? "number"
  const decimals = cfg.decimals ?? 0
  const unit = cfg.unit ?? ""

  const raw = extractScalar(payload)
  const numeric = typeof raw === "number" ? raw : Number(raw)

  const display = useMemo(() => {
    if (!Number.isFinite(numeric)) return raw === null || raw === undefined ? "—" : String(raw)
    return formatValue(numeric, format, decimals, unit)
  }, [numeric, raw, format, decimals, unit])

  const color = useMemo(
    () => (Number.isFinite(numeric) ? thresholdColor(numeric, cfg.thresholds) : null),
    [numeric, cfg.thresholds]
  )

  const showTrend =
    cfg.showTrend &&
    Number.isFinite(numeric) &&
    previousValue !== undefined &&
    Number.isFinite(previousValue)
  const delta = showTrend ? numeric - (previousValue as number) : 0
  const trendUp = delta > 0
  const trendFlat = Math.abs(delta) < Number.EPSILON

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1.5 p-1">
      {cfg.label ? (
        <div className="truncate text-xs font-medium uppercase tracking-wide text-muted-text">
          {cfg.label}
        </div>
      ) : null}

      <div className="flex items-baseline gap-1">
        {cfg.prefix ? (
          <span className="text-lg font-semibold text-muted-text">{cfg.prefix}</span>
        ) : null}
        <span
          className={cn(
            "font-mono text-4xl font-bold leading-none",
            color ? "" : "text-primary-text"
          )}
          style={color ? { color } : undefined}
          title={typeof display === "string" ? display : String(display)}
        >
          {display}
        </span>
        {cfg.suffix ? (
          <span className="text-lg font-semibold text-muted-text">{cfg.suffix}</span>
        ) : null}
      </div>

      {showTrend ? (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trendFlat ? "text-muted-text" : trendUp ? "text-success" : "text-error"
          )}
        >
          {trendFlat ? null : trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trendFlat ? "no change" : `${trendUp ? "+" : ""}${delta.toFixed(decimals)}`}</span>
        </div>
      ) : null}
    </div>
  )
}
