/**
 * Property editor panel for the selected data-pipe node.
 *
 * Renders form controls based on the NodeTemplateDef's property list,
 * with values flowing through React Flow's `updateNodeData`.
 */

import { Button, Input, Select, Toggle } from "@dockstat/ui"
import { cn } from "@sglara/cn"
import type { Node } from "@xyflow/react"
import { CircuitBoard, Flag, type LucideIcon, MousePointerClick, Plug, Shuffle } from "lucide-react"
import { useMemo } from "react"
import {
  type DataPipeNodeData,
  defaultDataFor,
  getNodeTemplate,
  NODE_KIND_META,
  NODE_TEMPLATES,
  type NodeTemplateDef,
  type PropertyField,
} from "widgets/client"

const KIND_ICON: Record<string, LucideIcon> = {
  connector: CircuitBoard,
  output: Flag,
  provider: Plug,
  transform: Shuffle,
}

interface PropertyPanelProps {
  node: Node<DataPipeNodeData> | null
  onChange: (id: string, data: Partial<DataPipeNodeData>) => void
  onDelete: (id: string) => void
  getWsTopics: () => string[]
}

/** Find the template that matches a node by its type + providerType/transformType */
function findTemplateForNode(
  node: Node<DataPipeNodeData>,
  getWsTopics: () => string[]
): NodeTemplateDef | undefined {
  const data = node.data
  const typeKey = data.providerType ?? data.transformType ?? node.type
  return (
    NODE_TEMPLATES({ getWsTopics: getWsTopics }).find(
      (t) => t.typeKey === typeKey && t.kind === node.type
    ) ?? getNodeTemplate(`${typeKey}-${node.type}`)
  )
}

export function PropertyPanel({ node, onChange, onDelete, getWsTopics }: PropertyPanelProps) {
  const template = useMemo(
    () => (node ? findTemplateForNode(node, getWsTopics) : undefined),
    [node, getWsTopics]
  )

  // ── Empty state ──────────────────────────────────────────────────
  if (!node || !template) {
    return (
      <div className="flex max-h-fit flex-col overflow-y-auto">
        <div className="border-b border-card-default-border px-4 py-3">
          <h2 className="text-sm font-semibold text-primary-text">Properties</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="rounded-full bg-card-default-bg p-3 text-muted-text">
            <MousePointerClick size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-text">No node selected</p>
            <p className="mt-1 text-xs text-muted-text">
              Click a node on the canvas to edit its properties.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const meta = NODE_KIND_META[template.kind]
  const Icon = KIND_ICON[template.kind] ?? MousePointerClick

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-card-default-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="rounded-md p-1.5"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            <Icon size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-primary-text">{template.label}</div>
            <div className="text-xs uppercase tracking-wide text-muted-text">{meta.label}</div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-text">{template.description}</p>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
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

        {template.properties.map((prop) => (
          <Field
            field={prop}
            key={prop.key}
            onChange={(val) => onChange(node.id, { [prop.key]: val } as Partial<DataPipeNodeData>)}
            value={node.data[prop.key]}
          />
        ))}

        {/* Output key field for output nodes */}
        {template.kind === "output" && !template.properties.some((p) => p.key === "key") && (
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

      {/* Footer */}
      <div className="border-t border-card-default-border p-4">
        <Button
          fullWidth
          onClick={() => onDelete(node.id)}
          size="sm"
          variant="danger"
        >
          Delete Node
        </Button>
      </div>
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
      <span className="flex items-center gap-1 text-xs font-medium text-secondary-text">
        {field.label}
        {field.required && <span className="text-error">*</span>}
      </span>

      {typeof field.type === "function" ? (
        <Select
          onChange={(val) => onChange(val)}
          options={(field.type as () => string[])().map((t) => ({ label: t, value: t }))}
          placeholder="Select a topic"
          size="sm"
          value={String(value ?? "")}
        />
      ) : field.type === "select" && field.options ? (
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
          className={cn(
            "w-full rounded-md border border-input-default-border bg-card-flat-bg px-2 py-1 font-mono text-sm text-input-default-text",
            "placeholder:text-muted-text",
            "focus:border-input-default-focus-border focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring"
          )}
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
          className={cn(
            "w-full rounded-md border border-input-default-border bg-card-flat-bg px-2 py-1 font-mono text-xs text-input-default-text",
            "placeholder:text-muted-text",
            "focus:border-input-default-focus-border focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring"
          )}
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
