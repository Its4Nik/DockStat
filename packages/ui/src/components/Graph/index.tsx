import { cn } from "@sglara/cn"
import { Handle, type NodeProps, Position } from "@xyflow/react"
import { Box } from "lucide-react"
import { memo } from "react"

interface ContainerNodeData {
  label: string
  status: string
  image?: string
  hostId?: number
}

export const ContainerNode = memo(
  ({ data, selected }: NodeProps<{ label: string } & ContainerNodeData>) => {
    const statusColor =
      data.status === "running"
        ? "#10b981"
        : data.status === "exited" || data.status === "dead"
          ? "#ef4444"
          : data.status === "paused"
            ? "#3b82f6"
            : "#f59e0b"

    return (
      <div
        className={cn(
          "min-w-[160px] rounded-lg border-2 p-2 shadow-md transition-all duration-200",
          selected ? "border-orange-500 ring-2 ring-orange-500/20" : "border-orange-500/30",
          "bg-gradient-to-br from-orange-950/90 to-orange-900/90"
        )}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className="p-1 rounded-md bg-orange-500/20">
            <Box className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <span className="text-xs font-medium text-orange-100 truncate">{data.label}</span>
        </div>

        {data.image && (
          <div className="text-xs text-orange-300/70 truncate mb-1" title={data.image}>
            {data.image}
          </div>
        )}

        <span
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            borderColor: statusColor,
            color: statusColor,
            backgroundColor: `${statusColor}15`,
            border: `1px solid ${statusColor}`,
          }}
        >
          {data.status}
        </span>

        <Handle
          type="target"
          position={Position.Left}
          className="w-2.5! h-2.5! bg-orange-400! border-2! border-orange-200!"
        />
      </div>
    )
  }
)

ContainerNode.displayName = "ContainerNode"

export const nodeTypes = {
  client: memo(({ data, selected }: NodeProps<any>) => {
    const statusColor =
      data.status === "online" ? "#10b981" : data.status === "offline" ? "#ef4444" : "#f59e0b"

    return (
      <div
        className={cn(
          "min-w-50 rounded-xl border-2 p-3 shadow-lg transition-all duration-200",
          selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-blue-500/30",
          "bg-linear-to-br from-blue-950/90 to-blue-900/90"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-blue-500/20">
            <svg
              className="h-4 w-4 text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <title>Icon</title>
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <line x1="6" y1="6" x2="6" y2="6" />
              <line x1="6" y1="18" x2="6" y2="18" />
            </svg>
          </div>
          <span className="text-sm font-medium text-blue-100 truncate">{data.label}</span>
        </div>

        <div className="space-y-1 text-xs">
          {data.ipAddress && (
            <div className="flex justify-between">
              <span className="text-blue-300/70">Endpoint:</span>
              <span className="text-blue-200 font-mono text-xs">
                {data.ipAddress}:{data.port || 4040}
              </span>
            </div>
          )}
          <div className="pt-1">
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{
                borderColor: statusColor,
                color: statusColor,
                backgroundColor: `${statusColor}15`,
                border: `1px solid ${statusColor}`,
              }}
            >
              {data.status}
            </span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-200"
        />
      </div>
    )
  }),
  host: memo(({ data, selected }: NodeProps<any>) => {
    const statusColor =
      data.status === "online" ? "#10b981" : data.status === "offline" ? "#ef4444" : "#f59e0b"

    return (
      <div
        className={cn(
          "min-w-[180px] rounded-xl border-2 p-3 shadow-lg transition-all duration-200",
          selected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-500/30",
          "bg-gradient-to-br from-emerald-950/90 to-emerald-900/90"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-emerald-500/20">
            <svg
              className="h-4 w-4 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <title>Icon</title>
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="text-sm font-medium text-emerald-100 truncate">{data.label}</span>
        </div>

        <div className="space-y-1 text-xs">
          {data.ipAddress && (
            <div className="flex justify-between">
              <span className="text-emerald-300/70">IP:</span>
              <span className="text-emerald-200 font-mono">{data.ipAddress}</span>
            </div>
          )}
          <div className="pt-1">
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{
                borderColor: statusColor,
                color: statusColor,
                backgroundColor: `${statusColor}15`,
                border: `1px solid ${statusColor}`,
              }}
            >
              {data.status}
            </span>
          </div>
        </div>

        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-200"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-200"
        />
      </div>
    )
  }),
  container: ContainerNode,
}
