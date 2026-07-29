/**
 * Built-in data providers and transformers.
 *
 * These are simple implementations that ship with the widgets package.
 * Consumers can register their own via `DataPipeEngine.registerProvider()`.
 *
 * Each `execute()` receives the node's typed configuration as the first
 * argument (`DataPipeNodeData`), so fields like `data.path`,
 * `data.expression`, etc. are fully type-checked.
 */

import type { DataPipeNode, DataPipeNodeData } from "../types"
import { DataProvider, DataTransformer } from "./types"

// ── Static / Mock Provider ─────────────────────────────────────────

/**
 * Produces a static value.  Useful for testing or simple dashboards.
 */
export class StaticProvider extends DataProvider {
  readonly type = "static"

  execute(data: DataPipeNodeData): unknown {
    return data.value
  }
}

// ── Time Provider ──────────────────────────────────────────────────

/**
 * Produces the current server timestamp on each evaluation.
 */
export class TimeProvider extends DataProvider {
  readonly type = "time"

  execute(): string {
    return new Date().toISOString()
  }
}

// ── Passthrough Transformer ───────────────────────────────────────

/**
 * Passes data through unchanged.
 */
export class PassthroughTransformer extends DataTransformer {
  readonly type = "passthrough"

  execute(input: unknown): unknown {
    return input
  }
}

// ── JSON Path Transformer ─────────────────────────────────────────

/**
 * Extracts a value from a JSON object using a dot-separated path.
 * e.g. path "data.containers" → input["data"]["containers"]
 */
export class JsonPathTransformer extends DataTransformer {
  readonly type = "jsonPath"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    const path = data.path ?? ""
    if (!path || input === undefined || input === null) return input

    const segments = path.split(".")
    let current: unknown = input

    for (const segment of segments) {
      if (current === null || current === undefined) return undefined
      if (typeof current === "object") {
        current = (current as Record<string, unknown>)[segment]
      } else {
        return undefined
      }
    }

    return current
  }
}

// ── Array Filter Transformer ──────────────────────────────────────

/**
 * Filters an array input using a configurable field matcher.
 * data: { field, operator, filterValue }
 */
export class ArrayFilterTransformer extends DataTransformer {
  readonly type = "arrayFilter"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const field = data.field ?? ""
    const operator = data.operator ?? "eq"
    const value = data.filterValue

    return input.filter((item) => {
      const itemVal = item as Record<string, unknown>
      const v = itemVal[field]

      switch (operator) {
        case "eq":
          return v === value
        case "neq":
          return v !== value
        case "gt":
          return (v as number) > (value as number)
        case "lt":
          return (v as number) < (value as number)
        default:
          return true
      }
    })
  }
}

// ── Expression Transformer ─────────────────────────────────────────

/**
 * Evaluates a JavaScript expression where `$` is bound to the input value.
 *
 * Only `$`, `Math`, `JSON`, and `String` are accessible — the expression
 * runs inside a try/catch so failures return `undefined` rather than
 * crashing the evaluation tick.
 *
 * Examples:
 *   "$"                        → identity
 *   "$.count * 2"              → multiply a field
 *   "Math.round($ * 100) / 100" → round to 2 decimals
 *   "$.map(x => x.name)"       → pluck names from an array
 */
export class ExpressionTransformer extends DataTransformer {
  readonly type = "expression"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    const expression = data.expression ?? "$"
    if (!expression.trim()) return input

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        "$",
        "Math",
        "JSON",
        "String",
        `"use strict"; return (${expression});`
      )
      return fn(input, Math, JSON, String)
    } catch {
      return undefined
    }
  }
}

// ── Aggregate Transformer ──────────────────────────────────────────

/**
 * Aggregates a numeric field across an array of objects.
 * data: { operation, field }
 */
export class AggregateTransformer extends DataTransformer {
  readonly type = "aggregate"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const operation = data.operation ?? "sum"
    const field = data.field ?? ""

    if (operation === "count") return input.length

    const values = input
      .map((item) => Number((item as Record<string, unknown>)[field]))
      .filter((n) => !Number.isNaN(n))

    if (values.length === 0) return 0

    switch (operation) {
      case "sum":
        return values.reduce((a, b) => a + b, 0)
      case "avg":
        return values.reduce((a, b) => a + b, 0) / values.length
      case "min":
        return Math.min(...values)
      case "max":
        return Math.max(...values)
      default:
        return input
    }
  }
}

// ── Sort Transformer ───────────────────────────────────────────────

/**
 * Sorts an array of objects by a field.
 * data: { field, direction }
 */
export class SortTransformer extends DataTransformer {
  readonly type = "sort"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (!Array.isArray(input)) return input

    const field = data.field ?? ""
    const direction = data.direction ?? "asc"

    const sorted = [...input].sort((a, b) => {
      const av = (a as Record<string, unknown>)[field]
      const bv = (b as Record<string, unknown>)[field]
      if (av === bv) return 0
      if (av === undefined || av === null) return 1
      if (bv === undefined || bv === null) return -1
      return av < bv ? -1 : 1
    })

    return direction === "desc" ? sorted.reverse() : sorted
  }
}

// ── Pick Fields Transformer ────────────────────────────────────────

/**
 * Picks specific fields from an object, dropping everything else.
 * data: { fields } — comma-separated field names
 */
export class PickFieldsTransformer extends DataTransformer {
  readonly type = "pick"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (input === null || input === undefined || typeof input !== "object") return input
    if (Array.isArray(input)) return input

    const raw = data.fields ?? ""
    const fields = raw
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)

    const result: Record<string, unknown> = {}
    const source = input as Record<string, unknown>
    for (const f of fields) {
      if (f in source) result[f] = source[f]
    }
    return result
  }
}

// ── Format Transformer ─────────────────────────────────────────────

/**
 * Formats values: numbers, percentages, dates, byte sizes.
 * data: { format, decimals }
 */
export class FormatTransformer extends DataTransformer {
  readonly type = "format"

  execute(input: unknown, data: DataPipeNodeData): unknown {
    if (input === undefined || input === null) return input

    const format = data.format ?? "number"
    const d = data.decimals ?? 2

    switch (format) {
      case "number": {
        const n = Number(input)
        return Number.isNaN(n) ? input : Number(n.toFixed(d))
      }
      case "percentage": {
        const n = Number(input)
        return Number.isNaN(n) ? input : `${(n * 100).toFixed(d)}%`
      }
      case "date": {
        const date = input instanceof Date ? input : new Date(input as string | number)
        return Number.isNaN(date.getTime()) ? input : date.toLocaleString()
      }
      case "bytes": {
        const n = Number(input)
        if (Number.isNaN(n)) return input
        const units = ["B", "KB", "MB", "GB", "TB"]
        let val = n
        let unit = 0
        while (val >= 1024 && unit < units.length - 1) {
          val /= 1024
          unit++
        }
        return `${val.toFixed(d)} ${units[unit]}`
      }
      default:
        return input
    }
  }
}
