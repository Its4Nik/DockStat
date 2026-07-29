/**
 * Shared helpers for widget renderers.
 *
 * These are pure, theme-agnostic functions that the SVG-based widget
 * renderers use to normalize incoming data-pipe payloads and resolve
 * display options (units, thresholds, formatting).
 */

import type { DataPayload } from "widgets/client"

// ── Threshold resolution ────────────────────────────────────────────

export interface Threshold {
  /** Lower bound (inclusive) at which this color takes effect. */
  value: number
  /** CSS color applied when the metric is >= this threshold. */
  color: string
}

/**
 * Pick the color for a numeric value from a list of thresholds.
 * Thresholds are sorted descending so the first one the value exceeds wins.
 */
export function thresholdColor(value: number, thresholds: Threshold[] | undefined): string | null {
  if (!thresholds || thresholds.length === 0) return null
  const sorted = [...thresholds].sort((a, b) => b.value - a.value)
  return sorted.find((t) => value >= t.value)?.color ?? null
}

// ── Number formatting ───────────────────────────────────────────────

export type NumberFormat = "number" | "percentage" | "bytes" | "date"

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"]

/**
 * Format a numeric value for display. Returns the raw string for
 * non-finite input so the widget shows something sensible rather
 * than `NaN`.
 */
export function formatValue(
  value: unknown,
  format: NumberFormat = "number",
  decimals = 0,
  unit = ""
): string {
  if (value === null || value === undefined) return "—"
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return String(value)

  let out: string
  switch (format) {
    case "bytes": {
      const abs = Math.abs(n)
      const i = Math.min(Math.floor(Math.log(abs || 1) / Math.log(1024)), BYTE_UNITS.length - 1)
      out = `${(n / 1024 ** i).toFixed(i === 0 ? 0 : decimals)} ${BYTE_UNITS[i]}`
      return out
    }
    case "percentage":
      out = `${(n * 100).toFixed(decimals)}%`
      return unit ? `${out} ${unit}` : out
    case "date":
      try {
        return new Date(n).toLocaleString()
      } catch {
        return String(value)
      }
    case "number":
    default:
      out = n.toFixed(decimals)
      return unit ? `${out}${unit.startsWith(" ") ? "" : " "}${unit}` : out
  }
}

// ── Payload extraction ──────────────────────────────────────────────

/**
 * Pull the "primary" value out of a payload. Data-pipe outputs are
 * arbitrary JSON, so we normalize a few common shapes:
 *
 *   - numbers/strings               → as-is
 *   - { value: ... }                → the value field
 *   - { data: ... }                 → the data field
 *   - arrays of { label, value }    → the array (for charts)
 *   - everything else               → returned as-is for JSON tree
 */
export function extractScalar(payload: DataPayload | undefined): unknown {
  if (!payload) return null
  const v = payload.value
  if (v === null || typeof v !== "object") return v
  if (Array.isArray(v)) return v
  if ("value" in v && typeof (v as Record<string, unknown>).value !== "object") {
    return (v as { value: unknown }).value
  }
  if ("data" in v && typeof (v as Record<string, unknown>).data !== "object") {
    return (v as { data: unknown }).data
  }
  return v
}

/**
 * Coerce a payload value into an array of `{ label, value }` points
 * for chart widgets. Accepts arrays of numbers, arrays of objects,
 * or a single object and returns `[]` when the shape is unrecognized.
 */
export interface ChartPoint {
  label: string
  value: number
}

export function extractSeries(payload: DataPayload | undefined): ChartPoint[] {
  if (!payload) return []
  const v = payload.value
  if (!Array.isArray(v)) return []

  return v
    .map((item, i): ChartPoint | null => {
      if (typeof item === "number") return { label: String(i), value: item }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>
        const label = typeof o.label === "string" ? o.label : String(o.name ?? o.key ?? i)
        const raw = o.value ?? o.y ?? o.count ?? o.metric
        if (typeof raw === "number") return { label, value: raw }
        if (typeof raw === "string" && Number.isFinite(Number(raw))) {
          return { label, value: Number(raw) }
        }
      }
      return null
    })
    .filter((p): p is ChartPoint => p !== null)
}

/**
 * Extract a 2D matrix for heatmaps. Accepts either:
 *   - number[][]                      → used directly
 *   - { cells: number[][] }           → unwrapped
 *   - [{ values: number[] }]          → row-major
 */
export function extractMatrix(payload: DataPayload | undefined): number[][] {
  if (!payload) return []
  const v = payload.value
  if (Array.isArray(v) && v.every((row) => Array.isArray(row))) {
    return v as number[][]
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>
    if (Array.isArray(o.cells) && o.cells.every((row) => Array.isArray(row))) {
      return o.cells as number[][]
    }
    if (Array.isArray(o.values) && o.values.every((row) => Array.isArray(row))) {
      return o.values as number[][]
    }
  }
  return []
}
