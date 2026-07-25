/**
 * Progress bar widget — horizontal bar showing value between min/max,
 * colored by threshold zones.
 */

import { cn } from "@sglara/cn"
import { useMemo } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"
import { extractScalar, formatValue, type Threshold, thresholdColor } from "./shared"

interface ProgressConfig {
  min?: number
  max?: number
  unit?: string
  decimals?: number
  label?: string
  thresholds?: Threshold[]
  showValue?: boolean
}

interface ProgressProps {
  config: WidgetConfig
  payload: DataPayload | undefined
}

export function Progress({ config, payload }: ProgressProps) {
  const cfg = config as ProgressConfig
  const min = cfg.min ?? 0
  const max = cfg.max ?? 100
  const decimals = cfg.decimals ?? 0
  const unit = cfg.unit ?? ""
  const showValue = cfg.showValue ?? true

  const raw = extractScalar(payload)
  const numeric = typeof raw === "number" ? raw : Number(raw)
  const value = Number.isFinite(numeric) ? numeric : 0
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100))
  const color = useMemo(
    () => (Number.isFinite(numeric) ? thresholdColor(value, cfg.thresholds) : null),
    [numeric, value, cfg.thresholds]
  )

  return (
    <div className="flex h-full w-full flex-col justify-center gap-2">
      {cfg.label ? (
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-text">
            {cfg.label}
          </span>
          {showValue && Number.isFinite(numeric) ? (
            <span className="font-mono text-sm font-semibold text-primary-text">
              {formatValue(value, "number", decimals, unit)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-card-flat-bg">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out")}
          style={{
            backgroundColor: color ?? "var(--color-accent)",
            width: `${pct}%`,
          }}
        />
      </div>
      {!cfg.label && showValue && Number.isFinite(numeric) ? (
        <div className="text-right font-mono text-xs text-muted-text">
          {formatValue(value, "number", decimals, unit)}
        </div>
      ) : null}
    </div>
  )
}
