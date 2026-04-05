import { cn } from "@sglara/cn"
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react"
import { Container } from "lucide-react"
import { memo } from "react"
import { Badge } from "../../Badge/Badge"

export interface ContainerNodeData extends Record<string, unknown> {
  label: string
  status: string
  image?: string
  hostId?: number
}

export const ContainerNode = memo(({ data, selected }: NodeProps<Node<ContainerNodeData>>) => {
  return (
    <div
      className={cn(
        "min-w-40 rounded-lg border bg-graph-container-card-bg p-2.5 shadow-md transition-all duration-200",
        selected
          ? "border border-graph-container-card-border ring-2 ring-graph-container-card-border/30"
          : "border border-graph-container-card-border/50"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="p-1 rounded-md bg-graph-container-card-border/20">
          <Container className="h-3.5 w-3.5 text-graph-container-card-border" />
        </div>
        <span
          className="text-xs font-semibold text-graph-container-text-primary truncate"
          title={data.label}
        >
          {data.label}
        </span>
      </div>

      {data.image && (
        <div
          className="text-xs text-graph-container-text-secondary truncate mb-1.5 pl-0.5"
          title={data.image}
        >
          {data.image}
        </div>
      )}

      <Badge
        size="xs"
        variant={data.status === "online" ? "success" : "error"}
      >
        {data.status}
      </Badge>

      <Handle
        className="w-2.5! h-2.5! bg-graph-container-card-border! border-2! border-graph-container-text-primary/40!"
        isConnectable={false}
        position={Position.Left}
        type="target"
      />
    </div>
  )
})

ContainerNode.displayName = "ContainerNode"
