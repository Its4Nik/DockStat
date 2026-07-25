/**
 * Property editor panel for the selected data-pipe node.
 *
 * Renders form controls based on the NodeTemplateDef's property list,
 * with values flowing through React Flow's `updateNodeData`.
 */

import { Button, Input, Select, Toggle } from "@dockstat/ui"
import type { Node } from "@xyflow/react"
import { useMemo } from "react"
import {
  type DataPipeNodeData,
  defaultDataFor,
  getNodeTemplate,
  NODE_TEMPLATES,
  type NodeTemplateDef,
  type PropertyField,
} from "widgets/client"

interface PropertyPanelProps {
  node: Node<DataPipeNodeData> | null
  onChange: (id: string, data: Partial<DataPipeNodeData>) => void
  onDelete: (id: string) => void
}

/** Find the template that matches a node by its type + providerType/transformType */
function findTemplateForNode(node: Node<DataPipeNodeData>): NodeTemplateDef | undefined {
  const data = node.data
  const typeKey = data.providerType ?? data.transformType ?? node.type
  return (
    NODE_TEMPLATES.find((t) => t.typeKey === typeKey && t.kind === node.type) ??
    getNodeTemplate(`${typeKey}-${node.type}`)
  )
}

export function PropertyPanel({ node, onChange, onDelete }: PropertyPanelProps) {
  const template = useMemo(() => (node ? findTemplateForNode(node) : undefined), [node])

  if (!node || !template) {
    return (
      <div className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-primary-text">Properties</h2>
        <p className="text-xs text-muted-text">
          Select a node on the canvas to edit its properties.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold text-primary-text">{template.label}</h2>
        <p className="text-xs text-muted-text">{template.description}</p>
      </div>

      <div className="space-y-3">
        {/* Label field (always present) */}
        <Field
          field={{
            description: "Human-readable label shown on the node",
            key: "label",
            label: "Label",
            type: "string",
          }}
          onChange={(val) => onChange(node.id, { label: val as string })}
          value={node.data.label}
        />

        {/* Template-specific fields */}
        {template.properties.map((prop) => (
          <Field
            field={prop}
            key={prop.key}
            onChange={(val) => onChange(node.id, { [prop.key]: val } as Partial<DataPipeNodeData>)}
            value={node.data[prop.key]}
          />
        ))}

        {/* Output key field for output nodes */}
        {template.kind === "output" && !template.properties.find((p) => p.key === "key") && (
          <Field
            field={{
              description: "The data-output key that widgets consume",
              key: "key",
              label: "Output Key",
              required: true,
              type: "string",
            }}
            onChange={(val) => onChange(node.id, { key: val as string })}
            value={node.data.key ?? "result"}
          />
        )}
      </div>

      <Button
        fullWidth
        onClick={() => onDelete(node.id)}
        size="sm"
        variant="danger"
      >
        Delete Node
      </Button>
    </div>
  )
}

// ── Single field renderer ───────────────────────────────────────────

function Field({
  field,
  value,
  onChange,
}: {
  field: PropertyField
  value: unknown
  onChange: (val: unknown) => void
}) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium text-secondary-text">
        {field.label}
        {field.required && <span className="ml-1 text-error">*</span>}
      </span>

      {field.type === "select" && field.options ? (
        <Select
          onChange={(val) => onChange(val)}
          options={(field.options ?? []).map((opt) => ({
            label: opt.label,
            value: String(opt.value),
          }))}
          size="sm"
          value={String(value ?? "")}
        />
      ) : field.type === "textarea" ? (
        <textarea
          className="w-full rounded-md border border-input-default-border bg-card-flat-bg px-2 py-1 font-mono text-sm text-input-default-text focus:border-input-default-focus-border focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring"
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          value={String(value ?? "")}
        />
      ) : field.type === "number" ? (
        <Input
          onChange={(val) => onChange(Number(val))}
          size="sm"
          type="number"
          value={String(value ?? 0)}
        />
      ) : field.type === "boolean" ? (
        <Toggle
          checked={Boolean(value)}
          label={field.label}
          onChange={(checked) => onChange(checked)}
          size="sm"
        />
      ) : field.type === "object" ? (
        <textarea
          className="w-full rounded-md border border-input-default-border bg-card-flat-bg px-2 py-1 font-mono text-xs text-input-default-text focus:border-input-default-focus-border focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring"
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              onChange(e.target.value) // keep as string if not valid JSON
            }
          }}
          rows={2}
          value={typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2)}
        />
      ) : (
        <Input
          onChange={(val) => onChange(val)}
          size="sm"
          value={String(value ?? "")}
        />
      )}

      {field.description && <p className="text-xs text-muted-text">{field.description}</p>}
    </div>
  )
}

/** Helper to create initial data for a new node from a template */
export function createNodeData(template: NodeTemplateDef): DataPipeNodeData {
  return defaultDataFor(template) as DataPipeNodeData
}
