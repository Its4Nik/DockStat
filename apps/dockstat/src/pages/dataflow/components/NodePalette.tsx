/**
 * Node palette sidebar — lists all available node templates grouped by kind.
 * Click a template to add it to the canvas.
 */

import type { CSSProperties } from "react"
import {
  type DataPipeNodeKind,
  NODE_KIND_META,
  NODE_TEMPLATES,
  type NodeTemplateDef,
} from "widgets/client"

interface NodePaletteProps {
  onAddNode: (template: NodeTemplateDef) => void
}

const KIND_ORDER: DataPipeNodeKind[] = ["provider", "transform", "connector", "output"]

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold text-primary-text">Add Nodes</h2>
        <p className="text-xs text-muted-text">Click to add to the canvas</p>
      </div>

      {KIND_ORDER.map((kind) => {
        const meta = NODE_KIND_META[kind]
        const templates = NODE_TEMPLATES.filter((t) => t.kind === kind)
        if (templates.length === 0) return null

        return (
          <div key={kind}>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-text">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {meta.label}
            </h3>
            <div
              className="space-y-1.5"
              style={{ "--node-border": `${meta.color}55` } as CSSProperties}
            >
              {templates.map((template) => (
                <button
                  className="w-full rounded-md border bg-card-default-bg px-3 py-2 text-left transition-all hover:border-accent hover:bg-card-elevated-bg"
                  key={template.id}
                  onClick={() => onAddNode(template)}
                  style={{ borderColor: `${meta.color}40` }}
                  type="button"
                >
                  <div className="text-sm font-medium text-primary-text">{template.label}</div>
                  <div className="line-clamp-1 text-xs text-muted-text">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
