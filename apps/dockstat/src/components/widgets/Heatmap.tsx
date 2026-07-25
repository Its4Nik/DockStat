/**
 * Heatmap widget — renders a 2D matrix of values as a color-coded grid.
 *
 * Pulls a `number[][]` from the payload and maps each cell to a color
 * via the configured d3-style interpolate scale. We don't bundle d3 —
 * instead we hand-roll the 5 most-used scales as simple stops.
 */

import { useMemo } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"
import { extractMatrix } from "./shared"

interface HeatmapConfig {
  colorScale?: string
  minValue?: number
  maxValue?: number
  showValues?: boolean
  cellRadius?: number
  xLabel?: string
  yLabel?: string
}

interface HeatmapProps {
  config: WidgetConfig
  payload: DataPayload | undefined
}

type ScaleName =
  | "interpolateInferno"
  | "interpolateBlues"
  | "interpolateGreens"
  | "interpolateRdYlGn"
  | "interpolateViridis"

// 5-stop approximations of the named d3 scales. Each entry is a list
// of RGB stops; we lerp between them in sRGB space (good enough for
// a heatmap; we avoid pulling d3-scale in for this).
const SCALES: Record<ScaleName, Array<[number, number, number]>> = {
  interpolateBlues: [
    [247, 251, 255],
    [109, 174, 213],
    [37, 113, 163],
    [8, 48, 107],
  ],
  interpolateGreens: [
    [237, 248, 233],
    [116, 196, 118],
    [35, 139, 69],
    [0, 68, 27],
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
  const stops = SCALES[scale] ?? SCALES.interpolateInferno
  const clamped = Math.max(0, Math.min(1, t))
  const i = Math.min(stops.length - 2, Math.floor(clamped * (stops.length - 1)))
  const localT = clamped * (stops.length - 1) - i
  const [r1, g1, b1] = stops[i]
  const [r2, g2, b2] = stops[i + 1]
  return `rgb(${Math.round(lerp(r1, r2, localT))}, ${Math.round(lerp(g1, g2, localT))}, ${Math.round(lerp(b1, b2, localT))})`
}

export function Heatmap({ config, payload }: HeatmapProps) {
  const cfg = config as HeatmapConfig
  const scale = (cfg.colorScale ?? "interpolateInferno") as ScaleName
  const showValues = cfg.showValues ?? false
  const cellRadius = cfg.cellRadius ?? 4

  const matrix = useMemo(() => extractMatrix(payload), [payload])
  const { min, max } = useMemo(() => {
    const mn = cfg.minValue ?? Math.min(...matrix.flat(), 0)
    const mx = cfg.maxValue ?? Math.max(...matrix.flat(), 1)
    return { max: mx, min: mn }
  }, [matrix, cfg.minValue, cfg.maxValue])

  const range = max - min || 1

  if (matrix.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-text">
        No matrix data
      </div>
    )
  }

  const cols = matrix[0].length
  const rows = matrix.length

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="grid min-h-0 flex-1 gap-0.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {matrix.flatMap((row, r) =>
          row.map((cell, c) => {
            const t = (cell - min) / range
            return (
              <div
                className="flex items-center justify-center text-[10px] font-mono"
                key={`cell-${r}-${c}`}
                style={{
                  backgroundColor: colorAt(scale, t),
                  borderRadius: cellRadius,
                  color: t > 0.6 ? "#0b0b0b" : "#f5f5f5",
                }}
                title={`[${r}, ${c}] = ${cell}`}
              >
                {showValues ? cell : ""}
              </div>
            )
          })
        )}
      </div>
      {(cfg.xLabel || cfg.yLabel) && (
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-text">
          <span>{cfg.yLabel ? `${cfg.yLabel} →` : ""}</span>
          <span>
            {cols} cols × {rows} rows
          </span>
          <span>{cfg.xLabel ? `↓ ${cfg.xLabel}` : ""}</span>
        </div>
      )}
    </div>
  )
}
