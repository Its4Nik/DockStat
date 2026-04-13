import { Button, Card } from "@dockstat/ui"
import type { Node } from "@xyflow/react"
import { Bolt, Container, HardDrive, Server } from "lucide-react"

export function NodeDetailsPanel({ node, onClose }: { node: Node | null; onClose: () => void }) {
  if (!node) return null

  // Use specific typing for data to avoid 'any'
  const data = node.data as {
    label?: string
    status?: string
    ipAddress?: string
    port?: number
    clientId?: number
    hostId?: number
    dockNodeId?: number
  }

  const getNodeIcon = () => {
    switch (node.type) {
      case "client":
        return <Bolt className="h-4 w-4 text-blue-400" />
      case "host":
        return <Server className="h-4 w-4 text-emerald-400" />
      case "docknode":
        return <HardDrive className="h-4 w-4 text-orange-400" />
      default:
        return <Container className="h-4 w-4 text-muted-text" />
    }
  }

  return (
    <Card
      className="w-72 shadow-xl"
      glass
    >
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">{getNodeIcon()}</div>
          <div>
            <div className="text-sm font-medium capitalize">{node.type}</div>
            <div className="text-xs text-muted-text">{data.label}</div>
          </div>
        </div>
        <Button
          onClick={onClose}
          size="sm"
          variant="ghost"
        >
          ×
        </Button>
      </div>
      <div className="p-3 space-y-1.5 text-xs">
        {Object.entries(data)
          .filter(([key]) => !["label", "type"].includes(key))
          .map(([key, value]) => (
            <div
              className="flex justify-between items-center"
              key={key}
            >
              <span className="text-muted-text capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}:
              </span>
              <span
                className="font-mono truncate max-w-37.5 text-right"
                title={String(value)}
              >
                {String(value ?? "N/A")}
              </span>
            </div>
          ))}
      </div>
    </Card>
  )
}
