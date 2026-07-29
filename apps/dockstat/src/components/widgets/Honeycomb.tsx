/**
 * Honeycomb widget — hexagonal grid where each cell represents a metric
 * or entity. Cell color is driven by the value against thresholds or a
 * color scale; size is uniform.
 *
 * Renders with CSS clip-path hexagons and CSS grid for layout.
 */

import { useMemo } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"
import { extractSeries, type Threshold } from "./shared"

interface HoneycombConfig {
  colorScale?: ScaleName
  minValue?: number
  maxValue?: number
  hexSize?: number
  showLabels?: boolean
  showValues?: boolean
  thresholds?: Threshold[]
  layout?: "flat-top" | "pointy-top"
}

interface HoneycombProps {
  config: WidgetConfig
  payload: DataPayload | undefined
}

type ScaleName =
  | "interpolateBlues"
  | "interpolateInferno"
  | "interpolateRdYlGn"
  | "interpolateViridis"

const SCALES: Record<ScaleName, Array<[number, number, number]>> = {
  interpolateBlues: [
    [247, 251, 255],
    [109, 174, 213],
    [37, 113, 163],
    [8, 48, 107],
  ],
  interpolateInferno: [
    [0, 0, 4],
    [122, 18, 71],
    [187, 55, 84],
    [249, 142, 9],
    [252, 255, 164],
  ],
  interpolateRdYlGn: [
    [165, 0, 38],
    [215, 48, 39],
    [253, 174, 97],
    [255, 255, 191],
    [145, 207, 96],
    [26, 152, 80],
    [0, 104, 55],
  ],
  interpolateViridis: [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37],
  ],
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function colorAt(scale: ScaleName, t: number): string {
  const stops = SCALES[scale] ?? SCALES.interpolateRdYlGn
  const clamped = Math.max(0, Math.min(1, t))
  const i = Math.min(stops.length - 2, Math.floor(clamped * (stops.length - 1)))
  const localT = clamped * (stops.length - 1) - i
  const [r1, g1, b1] = stops[i]
  const [r2, g2, b2] = stops[i + 1]
  return `rgb(${Math.round(lerp(r1, r2, localT))}, ${Math.round(lerp(g1, g2, localT))}, ${Math.round(lerp(b1, b2, localT))})`
}

export function Honeycomb({ config, payload }: HoneycombProps) {
  const cfg = config as HoneycombConfig
  const scale: ScaleName = (cfg.colorScale as ScaleName) ?? "interpolateRdYlGn"
  const showLabels = cfg.showLabels ?? true
  const showValues = cfg.showValues ?? true
  const size = cfg.hexSize ?? 28

  const cells = useMemo(() => extractSeries(payload), [payload])

  // Pre-sort thresholds once (descending) so per-cell color lookup is O(T) with
  // no per-cell allocation, instead of re-cloning+sorting inside thresholdColor.
  const sortedThresholds = useMemo(
    () => (cfg.thresholds ? [...cfg.thresholds].sort((a, b) => b.value - a.value) : []),
    [cfg.thresholds]
  )

  const { min, max } = useMemo(() => {
    if (cells.length === 0) return { max: 1, min: 0 }
    const values = cells.map((c) => c.value)
    return {
      max: cfg.maxValue ?? Math.max(...values),
      min: cfg.minValue ?? Math.min(...values),
    }
  }, [cells, cfg.minValue, cfg.maxValue])

  if (cells.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-text">
        No data
      </div>
    )
  }

  const range = max - min || 1
  // Compute columns: try ~sqrt(N) per row
  const cols = Math.ceil(Math.sqrt(cells.length))

  return (
    <div
      className="grid h-full w-full content-center gap-1.5"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {cells.map((cell, i) => {
        const t = (cell.value - min) / range
        const thresholdClr =
          sortedThresholds.length > 0
            ? (sortedThresholds.find((th) => cell.value >= th.value)?.color ?? null)
            : null
        const bg = thresholdClr ?? colorAt(scale, t)
        return (
          <div
            className="flex flex-col items-center justify-center p-1 text-center"
            key={`hex-${cell.label}-${i}`}
            style={{
              background: bg,
              clipPath:
                cfg.layout === "pointy-top"
                  ? "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
                  : "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
              color: t > 0.55 ? "#0b0b0b" : "#f5f5f5",
              minHeight: size,
              minWidth: size,
            }}
            title={`${cell.label}: ${cell.value}`}
          >
            {showLabels && (
              <span className="line-clamp-1 text-[10px] font-medium leading-tight">
                {cell.label}
              </span>
            )}
            {showValues && (
              <span className="font-mono text-[11px] font-bold leading-tight">{cell.value}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
