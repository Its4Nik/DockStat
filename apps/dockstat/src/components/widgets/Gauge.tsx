/**
 * Radial gauge widget — displays a single numeric value between a
 * configurable min and max, sweeping an arc whose color follows the
 * threshold zones defined in the widget config.
 *
 * Pure SVG so it scales perfectly to any tile size and respects the
 * dockstat theme via CSS variables for chrome (labels, ticks).
 */

import { cn } from "@sglara/cn"
import { useMemo } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"
import { extractScalar, formatValue, type Threshold, thresholdColor } from "./shared"

interface GaugeConfig {
  min?: number
  max?: number
  unit?: string
  decimals?: number
  label?: string
  thresholds?: Threshold[]
}

interface GaugeProps {
  config: WidgetConfig
  payload: DataPayload | undefined
}

const RADIUS = 70
const CENTER = 90
// Arc sweeps 270° from 135° (bottom-left) → 45° (bottom-right)
const ARC_START = 135
const ARC_SPAN = 270

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) {
  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, startDeg + sweepDeg)
  const large = sweepDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
}

export function Gauge({ config, payload }: GaugeProps) {
  const cfg = config as GaugeConfig
  const min = cfg.min ?? 0
  const max = cfg.max ?? 100
  const decimals = cfg.decimals ?? 0
  const unit = cfg.unit ?? ""

  const raw = extractScalar(payload)
  const numeric = typeof raw === "number" ? raw : Number(raw)
  const value = Number.isFinite(numeric) ? numeric : 0

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min || 1)))
  const sweep = pct * ARC_SPAN
  const color = thresholdColor(value, cfg.thresholds) ?? "var(--color-accent)"

  const display = useMemo(
    () => (Number.isFinite(numeric) ? formatValue(value, "number", decimals, unit) : "—"),
    [numeric, value, decimals, unit]
  )

  const trackPath = useMemo(() => arcPath(CENTER, CENTER, RADIUS, ARC_START, ARC_SPAN), [])
  const valuePath = useMemo(() => arcPath(CENTER, CENTER, RADIUS, ARC_START, sweep), [sweep])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
      <svg
        aria-label={`Gauge: ${display}`}
        className="h-full max-h-45 w-full"
        role="img"
        viewBox="0 0 180 180"
      >
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--color-card-flat-bg)"
          strokeLinecap="round"
          strokeWidth={14}
        />
        {/* Value arc */}
        <path
          d={valuePath}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={14}
          style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease" }}
        />
        {/* Center value */}
        <text
          dominantBaseline="central"
          fill="var(--color-primary-text)"
          fontFamily="var(--font-sans)"
          fontSize={28}
          fontWeight={700}
          textAnchor="middle"
          x={CENTER}
          y={CENTER - 6}
        >
          {display}
        </text>
        {cfg.label ? (
          <text
            dominantBaseline="central"
            fill="var(--color-muted-text)"
            fontFamily="var(--font-sans)"
            fontSize={11}
            textAnchor="middle"
            x={CENTER}
            y={CENTER + 22}
          >
            {cfg.label}
          </text>
        ) : null}
      </svg>
      {cfg.label && (
        <div
          aria-hidden
          className={cn("sr-only")}
        >
          {cfg.label}
        </div>
      )}
    </div>
  )
}
