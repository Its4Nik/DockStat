/**
 * Custom React Flow node components for the data-pipe editor.
 *
 * Each node kind (provider, transform, connector, output) gets its own
 * visual style.  Data is accessed through the typed DataPipeNodeData.
 */

import { Handle, type NodeProps, Position } from "@xyflow/react"
import type { DataPipeNodeData } from "widgets/client"
import { type DataPipeNodeKind, NODE_KIND_META } from "widgets/client"

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
  const borderColor = selected ? meta.color : `${meta.color}55`

  return (
    <div
      className="rounded-lg border-2 px-4 py-3 shadow-md min-w-[180px] bg-card transition-colors"
      style={{ borderColor }}
    >
      {hasTarget && (
        <Handle
          className="!h-3 !w-3 !border-2"
          position={Position.Left}
          style={{ borderColor: meta.color }}
          type="target"
        />
      )}

      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{data.label}</div>
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        </div>
      </div>

      {hasSource && (
        <Handle
          className="!h-3 !w-3 !border-2"
          position={Position.Right}
          style={{ borderColor: meta.color }}
          type="source"
        />
      )}
    </div>
  )
}

// ── Typed node components ───────────────────────────────────────────
//
// React Flow's NodeProps is generic over the Node type.  We cast `data`
// to our typed DataPipeNodeData inside each component for safety.

export function ProviderNode(props: NodeProps) {
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
}

export function TransformNode(props: NodeProps) {
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
}

export function ConnectorNode(props: NodeProps) {
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
}

export function OutputNode(props: NodeProps) {
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
}

// ── Registry for React Flow ─────────────────────────────────────────

export const dataPipeNodeTypes = {
  connector: ConnectorNode,
  output: OutputNode,
  provider: ProviderNode,
  transform: TransformNode,
} as const
