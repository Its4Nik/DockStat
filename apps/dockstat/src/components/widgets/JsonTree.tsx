/**
 * JSON Tree widget — collapsible viewer for inspecting raw payload data.
 *
 * Used as the default fallback when a widget's `kind` doesn't match a
 * known renderer, and registered explicitly as `builtin.json-tree` for
 * debugging complex payloads.
 */

import { cn } from "@sglara/cn"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Fragment, useState } from "react"
import type { DataPayload, WidgetConfig } from "widgets/client"

interface JsonTreeConfig {
  label?: string
  expanded?: boolean
  maxStringLength?: number
}

interface JsonTreeProps {
  config: WidgetConfig
  payload: DataPayload | undefined
}

export function JsonTree({ config, payload }: JsonTreeProps) {
  const cfg = config as JsonTreeConfig
  const startExpanded = cfg.expanded ?? false
  const maxStringLength = cfg.maxStringLength ?? 200
  const value = payload?.value

  return (
    <div className="h-full w-full overflow-auto font-mono text-xs">
      {cfg.label ? (
        <div className="border-b border-card-default-border pb-1 text-[10px] uppercase tracking-wide text-muted-text">
          {cfg.label}
        </div>
      ) : null}
      <Node
        maxStringLength={maxStringLength}
        name={payload?.key}
        startExpanded={startExpanded}
        value={value}
      />
    </div>
  )
}

// ── Recursive renderer ──────────────────────────────────────────────

interface NodeProps {
  name?: string
  value: unknown
  startExpanded: boolean
  maxStringLength: number
}

function Node({ name, value, startExpanded, maxStringLength }: NodeProps) {
  const [expanded, setExpanded] = useState(startExpanded)

  const isObject = value !== null && typeof value === "object"
  const isArray = Array.isArray(value)

  if (!isObject) {
    return (
      <div className="flex items-baseline gap-1.5 py-0.5 pl-2">
        {name !== undefined && <span className="text-accent">{name}:</span>}
        <ScalarValue
          maxStringLength={maxStringLength}
          value={value}
        />
      </div>
    )
  }

  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>)

  const Chevron: LucideIcon = ChevronRight

  return (
    <div className="pl-2">
      <button
        className="flex items-baseline gap-1 py-0.5 text-left hover:text-accent"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <Chevron
          className={cn("mt-0.5 shrink-0 transition-transform", expanded ? "rotate-90" : "")}
          size={12}
        />
        {name !== undefined && <span className="text-accent">{name}:</span>}
        <span className="text-muted-text">
          {isArray ? `Array(${entries.length})` : `{${entries.length}}`}
        </span>
      </button>
      {expanded && (
        <div className="ml-1 border-l border-card-default-border pl-2">
          {entries.map(([k, v]) => (
            <Fragment key={k}>
              <Node
                maxStringLength={maxStringLength}
                name={isArray ? undefined : k}
                startExpanded={false}
                value={v}
              />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

function ScalarValue({ value, maxStringLength }: { value: unknown; maxStringLength: number }) {
  if (value === null) return <span className="text-muted-text italic">null</span>
  if (typeof value === "string") {
    const truncated = value.length > maxStringLength ? `${value.slice(0, maxStringLength)}…` : value
    return <span className="text-success">"{truncated}"</span>
  }
  if (typeof value === "number")
    return <span className="text-badge-warning-outlined-text">{value}</span>
  if (typeof value === "boolean")
    return <span className="text-badge-primary-outlined-text">{String(value)}</span>
  return <span className="text-secondary-text">{String(value)}</span>
}
