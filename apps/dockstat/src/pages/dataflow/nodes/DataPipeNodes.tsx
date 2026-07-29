/**
 * Custom React Flow node components for the data-pipe editor.
 *
 * Visual style mirrors the dockstat Graph node pattern
 * (see packages/ui/src/components/Graph/nodes/*) so the dataflow
 * canvas feels like the rest of the app rather than a separate tool.
 *
 * Each kind (provider, transform, connector, output) has its own
 * theme tokens (`--color-dataflow-<kind>-*`) defined in App.css, so
 * re-skinning a kind is a CSS change rather than a code change.
 */

import { cn } from "@sglara/cn"
import { Handle, type NodeProps, Position } from "@xyflow/react"
import { CircuitBoard, Flag, type LucideIcon, Plug, Shuffle } from "lucide-react"
import { memo } from "react"
import type { DataPipeNodeData } from "widgets/client"
import { type DataPipeNodeKind, NODE_KIND_META } from "widgets/client"

// ── Per-kind visual config ──────────────────────────────────────────
//
// Tailwind needs to see literal class strings at build time, so each
// kind has a full set of class names rather than building them from
// template literals.

interface KindStyle {
  icon: LucideIcon
  card: string
  border: string
  borderSoft: string
  ring: string
  textPrimary: string
  textSecondary: string
  iconTint: string
  iconBg: string
  handle: string
}

const KIND_STYLE: Record<DataPipeNodeKind, KindStyle> = {
  connector: {
    border: "border-dataflow-connector-card-border",
    borderSoft: "border-dataflow-connector-card-border/50",
    card: "bg-dataflow-connector-card-bg",
    handle: "bg-dataflow-connector-card-border! border-dataflow-connector-text-primary/40!",
    icon: CircuitBoard,
    iconBg: "bg-dataflow-connector-card-border/20",
    iconTint: "text-dataflow-connector-text-secondary",
    ring: "ring-dataflow-connector-card-border/30",
    textPrimary: "text-dataflow-connector-text-primary",
    textSecondary: "text-dataflow-connector-text-secondary",
  },
  output: {
    border: "border-dataflow-output-card-border",
    borderSoft: "border-dataflow-output-card-border/50",
    card: "bg-dataflow-output-card-bg",
    handle: "bg-dataflow-output-card-border! border-dataflow-output-text-primary/40!",
    icon: Flag,
    iconBg: "bg-dataflow-output-card-border/20",
    iconTint: "text-dataflow-output-text-secondary",
    ring: "ring-dataflow-output-card-border/30",
    textPrimary: "text-dataflow-output-text-primary",
    textSecondary: "text-dataflow-output-text-secondary",
  },
  provider: {
    border: "border-dataflow-provider-card-border",
    borderSoft: "border-dataflow-provider-card-border/50",
    card: "bg-dataflow-provider-card-bg",
    handle: "bg-dataflow-provider-card-border! border-dataflow-provider-text-primary/40!",
    icon: Plug,
    iconBg: "bg-dataflow-provider-card-border/20",
    iconTint: "text-dataflow-provider-text-secondary",
    ring: "ring-dataflow-provider-card-border/30",
    textPrimary: "text-dataflow-provider-text-primary",
    textSecondary: "text-dataflow-provider-text-secondary",
  },
  transform: {
    border: "border-dataflow-transform-card-border",
    borderSoft: "border-dataflow-transform-card-border/50",
    card: "bg-dataflow-transform-card-bg",
    handle: "bg-dataflow-transform-card-border! border-dataflow-transform-text-primary/40!",
    icon: Shuffle,
    iconBg: "bg-dataflow-transform-card-border/20",
    iconTint: "text-dataflow-transform-text-secondary",
    ring: "ring-dataflow-transform-card-border/30",
    textPrimary: "text-dataflow-transform-text-primary",
    textSecondary: "text-dataflow-transform-text-secondary",
  },
}

// ── Base node card ──────────────────────────────────────────────────

interface NodeCardProps {
  kind: DataPipeNodeKind
  data: DataPipeNodeData
  selected: boolean
  hasSource: boolean
  hasTarget: boolean
  subtitle: string
}

function NodeCard({ kind, data, selected, hasSource, hasTarget, subtitle }: NodeCardProps) {
  const meta = NODE_KIND_META[kind]
  const s = KIND_STYLE[kind]
  const Icon = s.icon

  return (
    <div
      className={cn(
        "min-w-52 rounded-lg border p-3 shadow-md transition-all duration-200",
        s.card,
        s.textPrimary,
        selected ? cn("border-2 ring-2", s.border, s.ring) : cn("border", s.borderSoft)
      )}
      title={`${meta.label}: ${data.label}`}
    >
      {/* Header row: icon container + label */}
      <div className="mb-2 flex items-center gap-2">
        <div className={cn("rounded-md p-1.5", s.iconBg)}>
          <Icon className={cn("h-4 w-4", s.iconTint)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-sm font-semibold", s.textPrimary)}>{data.label}</div>
          <div className={cn("truncate text-xs", s.textSecondary)}>{subtitle}</div>
        </div>
      </div>

      {/* Kind tag — gives quick visual grouping at a glance */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-block rounded-md border border-card-default-border bg-card-default-bg/40 px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
            s.textSecondary
          )}
        >
          {meta.label}
        </span>
      </div>

      {hasTarget && (
        <Handle
          className={cn("h-3! w-3! border-2!", s.handle)}
          position={Position.Left}
          type="target"
        />
      )}
      {hasSource && (
        <Handle
          className={cn("h-3! w-3! border-2!", s.handle)}
          position={Position.Right}
          type="source"
        />
      )}
    </div>
  )
}

// ── Typed node components ───────────────────────────────────────────

export const ProviderNode = memo(function ProviderNode(props: NodeProps) {
  const data = props.data as DataPipeNodeData
  return (
    <NodeCard
      data={data}
      hasSource={true}
      hasTarget={false}
      kind="provider"
      selected={props.selected}
      subtitle={data.providerType ?? "unknown"}
    />
  )
})

export const TransformNode = memo(function TransformNode(props: NodeProps) {
  const data = props.data as DataPipeNodeData
  return (
    <NodeCard
      data={data}
      hasSource={true}
      hasTarget={true}
      kind="transform"
      selected={props.selected}
      subtitle={data.transformType ?? "unknown"}
    />
  )
})

export const ConnectorNode = memo(function ConnectorNode(props: NodeProps) {
  const data = props.data as DataPipeNodeData
  return (
    <NodeCard
      data={data}
      hasSource={true}
      hasTarget={true}
      kind="connector"
      selected={props.selected}
      subtitle="passthrough"
    />
  )
})

export const OutputNode = memo(function OutputNode(props: NodeProps) {
  const data = props.data as DataPipeNodeData
  return (
    <NodeCard
      data={data}
      hasSource={false}
      hasTarget={true}
      kind="output"
      selected={props.selected}
      subtitle={`→ ${data.key ?? "result"}`}
    />
  )
})

// ── Registry for React Flow ─────────────────────────────────────────

export const dataPipeNodeTypes = {
  connector: ConnectorNode,
  output: OutputNode,
  provider: ProviderNode,
  transform: TransformNode,
} as const
