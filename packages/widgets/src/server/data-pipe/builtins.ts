/**
 * Built-in data providers and transformers.
 *
 * These are simple implementations that ship with the widgets package.
 * Consumers can register their own via `DataPipeEngine.registerProvider()`.
 */

import type { DataPipeNode } from "../types"
import { DataProvider, DataTransformer } from "./types"

// ── Static / Mock Provider ─────────────────────────────────────────

/**
 * Produces a static value.  Useful for testing or simple dashboards.
 */
export class StaticProvider extends DataProvider {
  readonly type = "static"

  execute(node: DataPipeNode): unknown {
    return node.data["value"]
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

  execute(input: unknown, node: DataPipeNode): unknown {
    const path = (node.data["path"] as string) ?? ""
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
 * data: { field: string, operator: "eq"|"neq"|"gt"|"lt", value: unknown }
 */
export class ArrayFilterTransformer extends DataTransformer {
  readonly type = "arrayFilter"

  execute(input: unknown, node: DataPipeNode): unknown {
    if (!Array.isArray(input)) return input

    const { field, operator, value } = node.data as {
      field: string
      operator: "eq" | "neq" | "gt" | "lt"
      value: unknown
    }

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
