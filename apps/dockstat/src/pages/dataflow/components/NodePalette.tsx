/**
 * Node palette sidebar — lists all available node templates grouped by kind.
 *
 * Visual treatment mirrors the dashboard widget palette: each entry is a
 * clickable tile with an accent strip and a kind-tinted icon container so
 * users can find what they want to drop without reading every label.
 */

import { cn } from "@sglara/cn"
import { CircuitBoard, Flag, type LucideIcon, Plug, Plus, Shuffle } from "lucide-react"
import { useMemo } from "react"
import {
  type DataPipeNodeKind,
  NODE_KIND_META,
  NODE_TEMPLATES,
  type NodeTemplateDef,
} from "widgets/client"

interface NodePaletteProps {
  onAddNode: (template: NodeTemplateDef) => void
  getWsTopics: () => string[]
}

const KIND_ORDER: DataPipeNodeKind[] = ["provider", "transform", "connector", "output"]

/** Per-kind icon and Tailwind classes — literals so Tailwind picks them up. */
const KIND_UI: Record<DataPipeNodeKind, { icon: LucideIcon; accent: string; chip: string }> = {
  connector: {
    accent: "bg-dataflow-connector-card-border",
    chip: "bg-dataflow-connector-card-border/20 text-dataflow-connector-text-secondary",
    icon: CircuitBoard,
  },
  output: {
    accent: "bg-dataflow-output-card-border",
    chip: "bg-dataflow-output-card-border/20 text-dataflow-output-text-secondary",
    icon: Flag,
  },
  provider: {
    accent: "bg-dataflow-provider-card-border",
    chip: "bg-dataflow-provider-card-border/20 text-dataflow-provider-text-secondary",
    icon: Plug,
  },
  transform: {
    accent: "bg-dataflow-transform-card-border",
    chip: "bg-dataflow-transform-card-border/20 text-dataflow-transform-text-secondary",
    icon: Shuffle,
  },
}

export function NodePalette({ onAddNode, getWsTopics }: NodePaletteProps) {
  const templatesByKind = useMemo(() => {
    const all = NODE_TEMPLATES({ getWsTopics })
    const map = new Map<DataPipeNodeKind, NodeTemplateDef[]>()
    for (const t of all) {
      const list = map.get(t.kind)
      if (list) list.push(t)
      else map.set(t.kind, [t])
    }
    return map
  }, [getWsTopics])

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-card-default-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Plus
            className="text-accent"
            size={16}
          />
          <h2 className="text-sm font-semibold text-primary-text">Add Nodes</h2>
        </div>
        <p className="mt-1 text-xs text-muted-text">Click a tile to drop it on the canvas.</p>
      </div>

      {/* Groups */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {KIND_ORDER.map((kind) => {
          const meta = NODE_KIND_META[kind]
          const ui = KIND_UI[kind]
          const Icon = ui.icon
          const templates = templatesByKind.get(kind) ?? []
          if (templates.length === 0) return null

          return (
            <div key={kind}>
              <h3 className="mb-2 items-center text-xs font-semibold uppercase tracking-wide text-muted-text">
                <span className={cn("inline-block h-2 w-2 rounded-full mr-2", ui.accent)} />
                {meta.label}
              </h3>

              <div className="space-y-1.5">
                {templates.map((template) => (
                  <button
                    className={cn(
                      "group relative flex w-full items-start gap-2.5 overflow-hidden rounded-md border border-card-default-border bg-card-default-bg px-3 py-2 text-left transition-all",
                      "hover:border-accent hover:bg-card-elevated-bg",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    )}
                    key={template.id}
                    onClick={() => onAddNode(template)}
                    type="button"
                  >
                    {/* Accent strip — reinforces kind while hovering */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-0 left-0 w-0.5 opacity-60 transition-opacity group-hover:opacity-100",
                        ui.accent
                      )}
                    />

                    <span className={cn("mt-0.5 rounded-md p-1", ui.chip)}>
                      <Icon size={14} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-primary-text">
                        {template.label}
                      </span>
                      <span className="line-clamp-2 block text-xs text-muted-text">
                        {template.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
