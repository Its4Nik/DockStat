/**
 * Node palette sidebar — lists all available node templates grouped by kind.
 * Click a template to add it to the canvas.
 */

import { Card, CardBody } from "@dockstat/ui"
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
    <div className="p-4 space-y-6">
      <div>
        <h2 className="font-semibold mb-1">Add Nodes</h2>
        <p className="text-xs text-muted-foreground">Click to add to the canvas</p>
      </div>

      {KIND_ORDER.map((kind) => {
        const meta = NODE_KIND_META[kind]
        const templates = NODE_TEMPLATES.filter((t) => t.kind === kind)
        if (templates.length === 0) return null

        return (
          <div key={kind}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {meta.label}
            </h3>
            <div
              className="space-y-1.5"
              style={{ "--node-border": `${meta.color}33` } as CSSProperties}
            >
              {templates.map((template) => (
                <Card
                  className="w-full text-left [border-color:var(--node-border)]"
                  hoverable
                  key={template.id}
                  onClick={() => onAddNode(template)}
                  size="sm"
                >
                  <CardBody>
                    <div className="font-medium text-sm">{template.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {template.description}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
