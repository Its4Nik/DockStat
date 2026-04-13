import { cn } from "@sglara/cn"
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react"
import { Bolt } from "lucide-react"
import { memo } from "react"

export interface ClientNodeData extends Record<string, unknown> {
  label: string
  status: string
  ipAddress?: string
  port?: number
}

const statusStyleMap = {
  offline: "text-badge-error-outlined-text border-badge-error-outlined-border bg-badge-error-bg/10",
  online: "text-success border-badge-success-outlined-border bg-badge-success-bg/10",
}

export const ClientNode = memo(({ data, selected }: NodeProps<Node<ClientNodeData>>) => {
  const badge = data.status === "online" ? statusStyleMap.online : statusStyleMap.offline

  return (
    <div
      className={cn(
        "min-w-45 rounded-lg border bg-graph-client-card-bg p-3 shadow-md transition-all duration-200",
        selected
          ? "border-2 border-graph-client-card-border ring-2 ring-graph-client-card-border/30"
          : "border border-graph-client-card-border/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-graph-client-card-border/20">
          <Bolt className="h-4 w-4 text-graph-client-text-secondary" />
        </div>
        <span
          className="text-sm font-semibold text-graph-client-text-primary truncate"
          title={data.label}
        >
          {data.label}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        {data.ipAddress && (
          <div className="flex justify-between gap-3">
            <span className="text-graph-client-text-secondary">Endpoint:</span>
            <span className="text-graph-client-text-primary font-mono">
              {data.ipAddress}:{data.port ?? 4040}
            </span>
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
        className="w-3! h-3! bg-graph-client-card-border! border-2! border-graph-client-text-primary/40!"
        isConnectable={false}
        position={Position.Right}
        type="source"
      />
    </div>
  )
})

ClientNode.displayName = "ClientNode"
