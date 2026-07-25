/**
 * Sparkline widget — compact area/line chart for a numeric series.
 *
 * Renders a smooth SVG path from a list of numbers pulled from the
 * data-pipe payload. Optimized for small tile sizes (no axes, no
 * gridlines) but readable enough to convey trend at a glance.
 */

import { useMemo } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"

interface SparklineConfig {
  stroke?: string
  fill?: string
  strokeWidth?: number
  showDots?: boolean
  showArea?: boolean
  min?: number | null
  max?: number | null
  label?: string
  unit?: string
}

interface SparklineProps {
  config: WidgetConfig
  payload: DataPayload | undefined
}

function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === "number") return v
        if (typeof v === "string" && Number.isFinite(Number(v))) return Number(v)
        if (v && typeof v === "object") {
          const o = v as Record<string, unknown>
          const candidate = o.value ?? o.y ?? o.count
          if (typeof candidate === "number") return candidate
        }
        return Number.NaN
      })
      .filter((n) => Number.isFinite(n))
  }
  if (typeof value === "number") return [value]
  return []
}

export function Sparkline({ config, payload }: SparklineProps) {
  const cfg = config as SparklineConfig
  const stroke = cfg.stroke ?? "var(--color-accent)"
  const fill = cfg.fill ?? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
  const strokeWidth = cfg.strokeWidth ?? 2
  const showDots = cfg.showDots ?? false
  const showArea = cfg.showArea ?? true

  const series = useMemo(() => toNumberArray(payload?.value), [payload])

  const { path, area, points, last } = useMemo(() => {
    if (series.length === 0) return { area: "", last: null, path: "", points: [] }
    const W = 100
    const H = 30
    const pad = strokeWidth
    const min = cfg.min ?? Math.min(...series)
    const max = cfg.max ?? Math.max(...series)
    const range = max - min || 1
    const stepX = series.length > 1 ? (W - pad * 2) / (series.length - 1) : 0

    const pts = series.map((v, i) => ({
      x: pad + i * stepX,
      y: pad + (H - pad * 2) * (1 - (v - min) / range),
    }))

    const d = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ")
    const a = showArea
      ? `${d} L ${pts[pts.length - 1].x.toFixed(2)} ${H} L ${pts[0].x.toFixed(2)} ${H} Z`
      : ""

    return { area: a, last: series[series.length - 1], path: d, points: pts }
  }, [series, cfg.min, cfg.max, strokeWidth, showArea])

  if (series.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-text">
        No data
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      {(cfg.label || cfg.unit) && (
        <div className="flex items-baseline justify-between gap-2">
          {cfg.label ? (
            <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-text">
              {cfg.label}
            </span>
          ) : (
            <span />
          )}
          {cfg.unit && last !== null ? (
            <span className="font-mono text-sm font-semibold text-primary-text">
              {last.toFixed(2)}
              <span className="ml-0.5 text-xs text-muted-text">{cfg.unit}</span>
            </span>
          ) : null}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <svg
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 30"
        >
          {showArea && area ? (
            <path
              d={area}
              fill={fill}
            />
          ) : null}
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
          {showDots &&
            points.map((p, i) => (
              <circle
                cx={p.x}
                cy={p.y}
                fill={stroke}
                key={`dot-${i}`}
                r={1.4}
              />
            ))}
        </svg>
      </div>
    </div>
  )
}
