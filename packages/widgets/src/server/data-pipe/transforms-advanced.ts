/**
 * Advanced data-pipe transformers for complex data-graph scenarios.
 *
 * These complement the basic transformers in `builtins.ts` and are geared
 * towards reshaping data for chart / visualization widgets:
 *
 *  - GroupBy      → group array records by a key, with per-group aggregation
 *  - Flatten      → flatten nested arrays or array-of-arrays
 *  - Pivot        → pivot rows into columns (wide ↔ long)
 *  - TopN         → keep only the top-N records by a field
 *  - Window       → sliding-window aggregation over a time-ordered array
 *  - MapFields    → rename / project fields on each record
 */

import type { DataPipeNodeData } from "../types"
import { DataTransformer } from "./types"

// ── Helpers ──────────────────────────────────────────────────────────

type Record_ = Record<string, unknown>

function toNumberArray(input: unknown, field: string): number[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => Number((item as Record_)[field]))
    .filter((n) => !Number.isNaN(n))
}

function aggregate(values: number[], op: string): number {
  if (values.length === 0) return 0
  switch (op) {
    case "sum":
      return values.reduce((a, b) => a + b, 0)
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length
    case "min":
      return Math.min(...values)
    case "max":
      return Math.max(...values)
    case "count":
      return values.length
    case "first":
      return values[0] ?? 0
    case "last":
      return values[values.length - 1] ?? 0
    default:
      return values.reduce((a, b) => a + b, 0)
  }
}

// ── GroupBy Transformer ──────────────────────────────────────────────

/**
 * Groups an array of objects by a field and applies per-field aggregations.
 *
 * data: {
 *   field:        "category"                    // group key
 *   aggregations: { sales: "sum", qty: "avg" }  // field → operation
 * }
 *
 * Output: [{ category: "A", sales: 420, qty: 12.5 }, …]
 */
export class GroupByTransformer extends DataTransformer {
  readonly type = "groupBy"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const groupField = data.field ?? ""
    const aggs = (data.aggregations ?? {}) as Record<string, string>
    if (!groupField) return input

    const groups = new Map<string, Record_[]>()

    for (const item of input) {
      const rec = item as Record_
      const key = String(rec[groupField] ?? "—")
      const bucket = groups.get(key)
      if (bucket) {
        bucket.push(rec)
      } else {
        groups.set(key, [rec])
      }
    }

    const result: Record_[] = []
    for (const [key, records] of groups) {
      const out: Record_ = { [groupField]: key }
      for (const [aggField, op] of Object.entries(aggs)) {
        out[aggField] = aggregate(toNumberArray(records, aggField), op)
      }
      result.push(out)
    }

    return result
  }
}

// ── Flatten Transformer ──────────────────────────────────────────────

/**
 * Flattens nested arrays.
 *
 * data: {
 *   path?:  "items"   // optional — flatten a nested array field on each record
 *   depth?: 1         // flatten depth (default Infinity)
 * }
 *
 * Without `path`: [1, [2, [3]]] → [1, 2, 3]
 * With `path`:    [{ items: [1,2] }, { items: [3] }] → [1, 2, 3]
 */
export class FlattenTransformer extends DataTransformer {
  readonly type = "flatten"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const path = data.path
    const depth = typeof data.depth === "number" ? data.depth : Infinity

    // If a path is given, pluck the nested array from each record first
    let arrays: unknown[]
    if (path) {
      arrays = input.map((item) => (item as Record_)[path] ?? [])
    } else {
      arrays = input
    }

    const flat = (arr: unknown[], currentDepth: number): unknown[] => {
      const out: unknown[] = []
      for (const el of arr) {
        if (Array.isArray(el) && currentDepth < depth) {
          out.push(...flat(el, currentDepth + 1))
        } else {
          out.push(el)
        }
      }
      return out
    }

    return flat(arrays, 0)
  }
}

// ── Pivot Transformer ────────────────────────────────────────────────

/**
 * Pivots long-format data into wide format.
 *
 * data: {
 *   rowField:   "month"
 *   colField:   "product"
 *   valueField: "sales"
 *   operation:  "sum"       // aggregation for duplicate row+col pairs
 * }
 *
 * Input:  [{ month: "Jan", product: "A", sales: 10 }, { month: "Jan", product: "B", sales: 5 }]
 * Output: [{ month: "Jan", A: 10, B: 5 }]
 */
export class PivotTransformer extends DataTransformer {
  readonly type = "pivot"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const rowField = data.rowField ?? ""
    const colField = data.colField ?? ""
    const valueField = data.valueField ?? ""
    const op = data.operation ?? "sum"
    if (!rowField || !colField || !valueField) return input

    const rows = new Map<string, Record_>()
    const columns = new Set<string>()

    for (const item of input) {
      const rec = item as Record_
      const rowKey = String(rec[rowField] ?? "—")
      const colKey = String(rec[colField] ?? "—")
      const val = Number(rec[valueField])

      columns.add(colKey)

      let row = rows.get(rowKey)
      if (!row) {
        row = { [rowField]: rowKey }
        rows.set(rowKey, row)
      }

      if (colKey in row && typeof row[colKey] === "number") {
        // Combine duplicates using the selected operation
        const existing = [row[colKey] as number, Number.isNaN(val) ? 0 : val]
        row[colKey] = aggregate(existing, op)
      } else {
        row[colKey] = Number.isNaN(val) ? 0 : val
      }
    }

    return Array.from(rows.values())
  }
}

// ── TopN Transformer ─────────────────────────────────────────────────

/**
 * Keeps only the top-N (or bottom-N) records sorted by a field.
 *
 * data: {
 *   field:     "score"
 *   count:     5
 *   direction: "desc"   // "asc" for bottom-N
 * }
 */
export class TopNTransformer extends DataTransformer {
  readonly type = "topN"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const field = data.field ?? ""
    const n = typeof data.count === "number" ? data.count : 10
    const direction = data.direction ?? "desc"

    const sorted = [...input].sort((a, b) => {
      const av = (a as Record_)[field]
      const bv = (b as Record_)[field]
      if (av === bv) return 0
      if (av === undefined || av === null) return 1
      if (bv === undefined || bv === null) return -1
      return av < bv ? -1 : 1
    })

    const ordered = direction === "desc" ? sorted.reverse() : sorted
    return ordered.slice(0, n)
  }
}

// ── Window Transformer ───────────────────────────────────────────────

/**
 * Applies a sliding-window aggregation over an ordered array.
 *
 * Produces an array of aggregated values — one per window position.
 *
 * data: {
 *   field:    "price"
 *   size:     3              // window size
 *   operation: "avg"         // sum | avg | min | max
 * }
 *
 * Input:  [{ price: 10 }, { price: 20 }, { price: 30 }, { price: 40 }]
 * Output: [{ windowStart: 0, avg: 10 }, { windowStart: 1, avg: 15 }, …]
 */
export class WindowTransformer extends DataTransformer {
  readonly type = "window"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const field = data.field ?? ""
    const size = typeof data.size === "number" && data.size > 0 ? data.size : 3
    const op = data.operation ?? "avg"

    const numbers = input.map((item) => Number((item as Record_)[field]))

    const result: Record_[] = []
    for (let i = 0; i <= numbers.length - size; i++) {
      const window = numbers.slice(i, i + size).filter((n) => !Number.isNaN(n))
      result.push({
        windowStart: i,
        [field]: aggregate(window, op),
      })
    }

    return result
  }
}

// ── MapFields Transformer ────────────────────────────────────────────

/**
 * Renames fields on each record in an array (or single object).
 *
 * data: {
 *   mapping: { oldName: "newName", price: "value" }
 * }
 *
 * Supports dot-notation in the *new* name to promote nested values:
 *   { "meta.title": "title" }  → record.title = record.meta.title
 */
export class MapFieldsTransformer extends DataTransformer {
  readonly type = "mapFields"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    const mapping = (data.mapping ?? {}) as Record<string, string>
    if (Object.keys(mapping).length === 0) return input

    const transformRecord = (rec: Record_): Record_ => {
      const out: Record_ = {}
      for (const [oldKey, newKey] of Object.entries(mapping)) {
        if (oldKey in rec) {
          this.setNested(out, newKey, rec[oldKey])
        }
      }
      return out
    }

    if (Array.isArray(input)) {
      return input.map((item) => {
        if (item !== null && typeof item === "object") {
          return transformRecord(item as Record_)
        }
        return item
      })
    }

    if (input !== null && typeof input === "object") {
      return transformRecord(input as Record_)
    }

    return input
  }

  /** Sets a value at a dot-separated path, creating intermediate objects. */
  private setNested(obj: Record_, path: string, value: unknown): void {
    const parts = path.split(".")
    let current = obj
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!
      if (typeof current[part] !== "object" || current[part] === null) {
        current[part] = {}
      }
      current = current[part] as Record_
    }
    current[parts[parts.length - 1]!] = value
  }
}
