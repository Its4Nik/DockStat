/**
 * Bar chart widget — renders categorical data as vertical or horizontal
 * bars with optional value labels, axis labels, and gridlines.
 *
 * Pure SVG, theme-aware. Color comes from widget config.
 */

import { cn } from "@sglara/cn"
import { useMemo } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"
import { extractSeries, formatValue } from "./shared"

interface BarChartConfig {
  orientation?: "vertical" | "horizontal"
  color?: string
  barWidth?: number
  showLabels?: boolean
  showGrid?: boolean
  yAxisLabel?: string
  xAxisLabel?: string
  unit?: string
  decimals?: number
}

interface BarChartProps {
  config: WidgetConfig
  payload: DataPayload | undefined
}

export function BarChart({ config, payload }: BarChartProps) {
  const cfg = config as BarChartConfig
  const horizontal = cfg.orientation === "horizontal"
  const color = cfg.color ?? "var(--color-accent)"
  const barWidth = typeof cfg.barWidth === "number" ? Math.max(0.1, Math.min(1, cfg.barWidth)) : 0.8
  const showLabels = cfg.showLabels ?? true
  const showGrid = cfg.showGrid ?? true
  const decimals = cfg.decimals ?? 0
  const unit = cfg.unit ?? ""

  const points = useMemo(() => extractSeries(payload), [payload])

  if (points.length === 0) {
    return <EmptyChart />
  }

  const max = Math.max(...points.map((p) => p.value), 0)
  const min = Math.min(...points.map((p) => p.value), 0)
  const range = max - min || 1

  if (horizontal) {
    return (
      <HorizontalBars
        color={color}
        decimals={decimals}
        points={points}
        range={range}
        showLabels={showLabels}
        unit={unit}
      />
    )
  }

  // ── Vertical layout ─────────────────────────────────────────────
  const chartHeight = 100 // viewBox units
  const gap = 4
  const slotW = 100 / points.length
  const barW = slotW * barWidth

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        <svg
          aria-label="Bar chart"
          className="h-full w-full"
          preserveAspectRatio="none"
          role="img"
          viewBox="0 0 100 100"
        >
          {showGrid && (
            <g
              stroke="var(--color-card-default-border)"
              strokeWidth={0.4}
            >
              {[0.25, 0.5, 0.75].map((t) => (
                <line
                  key={t}
                  opacity={0.5}
                  x1={0}
                  x2={100}
                  y1={chartHeight * (1 - t)}
                  y2={chartHeight * (1 - t)}
                />
              ))}
            </g>
          )}
          {points.map((p, i) => {
            const h = (Math.abs(p.value - Math.max(0, min)) / range) * chartHeight
            const x = i * slotW + (slotW - barW) / 2
            const y = chartHeight - (p.value >= 0 ? h : 0)
            return (
              <g key={`${p.label}-${i}`}>
                <rect
                  fill={color}
                  height={h}
                  rx={1.2}
                  style={{ transition: "height 0.3s ease, y 0.3s ease" }}
                  width={barW}
                  x={x}
                  y={y}
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* X axis labels */}
      <div
        className="mt-1 flex text-xs text-muted-text"
        style={{ gap }}
      >
        {points.map((p, i) => (
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center truncate",
              showLabels ? "" : "opacity-70"
            )}
            key={`x-${p.label}-${i}`}
            style={{ width: `${100 / points.length}%` }}
          >
            <span className="truncate">{p.label}</span>
            {showLabels && (
              <span className="font-mono text-secondary-text">
                {formatValue(p.value, "number", decimals, unit)}
              </span>
            )}
          </div>
        ))}
      </div>
      {cfg.xAxisLabel ? (
        <div className="mt-0.5 text-center text-xs text-muted-text">{cfg.xAxisLabel}</div>
      ) : null}
    </div>
  )
}

function HorizontalBars({
  color,
  decimals,
  points,
  range,
  showLabels,
  unit,
}: {
  color: string
  decimals: number
  points: { label: string; value: number }[]
  range: number
  showLabels: boolean
  unit: string
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5">
      {points.map((p, i) => (
        <div
          className="flex items-center gap-2"
          key={`h-${p.label}-${i}`}
        >
          <div className="w-16 shrink-0 truncate text-right text-xs text-secondary-text">
            {p.label}
          </div>
          <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-card-flat-bg">
            <div
              className="h-full rounded-sm"
              style={{
                backgroundColor: color,
                transition: "width 0.3s ease",
                width: `${(p.value / range) * 100}%`,
              }}
            />
          </div>
          {showLabels && (
            <div className="w-14 shrink-0 font-mono text-xs text-secondary-text">
              {formatValue(p.value, "number", decimals, unit)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-muted-text">
      No data
    </div>
  )
}
