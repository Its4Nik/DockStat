import { cn } from "@sglara/cn"
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react"
import { Server } from "lucide-react"
import { memo } from "react"

interface HostNodeData extends Record<string, unknown> {
  label: string
  status: string
  ipAddress?: string
}

const statusStyleMap: Record<string, string> = {
  online:
    "text-badge-success-outlined-text border-badge-success-outlined-border bg-badge-success-bg/10",
  offline: "text-badge-error-outlined-text border-badge-error-outlined-border bg-badge-error-bg/10",
}

const fallbackBadge =
  "text-badge-warning-outlined-text border-badge-warning-outlined-border bg-badge-warning-bg/10"

export const HostNode = memo(({ data, selected }: NodeProps<Node<HostNodeData>>) => {
  const badge = statusStyleMap[data.status] ?? fallbackBadge

  return (
    <div
      className={cn(
        "min-w-45 rounded-lg border bg-graph-host-card-bg p-3 shadow-md transition-all duration-200",
        selected
          ? "border-2 border-graph-host-card-border ring-2 ring-graph-host-card-border/30"
          : "border border-graph-host-card-border/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-graph-host-card-border/20">
          <Server className="h-4 w-4 text-graph-host-text-secondary" />
        </div>
        <span
          className="text-sm font-semibold text-graph-host-text-primary truncate"
          title={data.label}
        >
          {data.label}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        {data.ipAddress && (
          <div className="flex justify-between gap-3">
            <span className="text-graph-host-text-secondary">IP:</span>
            <span className="text-graph-host-text-primary font-mono">{data.ipAddress}</span>
          </div>
        )}
        <div className="pt-1">
          <span
            className={cn("inline-block px-2 py-0.5 rounded-md border text-xs font-medium", badge)}
          >
            {data.status}
          </span>
        </div>
      </div>

      <Handle
        type="target"
        isConnectable={false}
        position={Position.Left}
        className="w-3! h-3! bg-graph-host-card-border! border-2! border-graph-host-text-primary/40!"
      />
      <Handle
        type="source"
        isConnectable={false}
        position={Position.Right}
        className="w-3! h-3! bg-graph-host-card-border! border-2! border-graph-host-text-primary/40!"
      />
    </div>
  )
})

HostNode.displayName = "HostNode"
