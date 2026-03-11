import { Badge, Button, Card, Divider } from "@dockstat/ui"
import { nodeTypes } from "@dockstat/ui"
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Node,
  Panel,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Activity, MapPin, Maximize2, RefreshCw, Route, Server } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

// Stats display component
function StatsDisplay({ clients, hosts }: { clients: any[]; hosts: any[] }) {
  const onlineClients = clients?.filter((c) => c.reachable).length || 0
  const onlineHosts = hosts?.filter((h) => h.reachable).length || 0

  return (
    <div className="flex gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-xs">
        <Server className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-blue-300">Clients:</span>
        <span className="font-semibold text-blue-100">{clients?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs">
        <Activity className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-emerald-300">Hosts:</span>
        <span className="font-semibold text-emerald-100">{hosts?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-xs">
        <span className="text-green-300">Online:</span>
        <span className="font-semibold text-green-100">{onlineClients + onlineHosts}</span>
      </div>
    </div>
  )
}

// Node details panel
function NodeDetailsPanel({ node, onClose }: { node: Node | null; onClose: () => void }) {
  if (!node) return null

  const data = node.data as Record<string, any>

  const getNodeIcon = () => {
    switch (node.type) {
      case "client":
        return <Server className="h-4 w-4 text-blue-400" />
      case "host":
        return <Activity className="h-4 w-4 text-emerald-400" />
      default:
        return <MapPin className="h-4 w-4 text-orange-400" />
    }
  }

  return (
    <Card variant="elevated" className="w-72 shadow-xl">
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">{getNodeIcon()}</div>
          <div>
            <div className="text-sm font-medium capitalize">{node.type}</div>
            <div className="text-xs text-muted-text">{data.label}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      <div className="p-3 space-y-1.5 text-xs">
        {Object.entries(data)
          .filter(([key]) => !["label", "type"].includes(key))
          .map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-muted-text capitalize">{key}:</span>
              <span className="font-mono truncate max-w-[150px]" title={String(value)}>
                {String(value ?? "N/A")}
              </span>
            </div>
          ))}
      </div>
    </Card>
  )
}

// Legend component
function Legend() {
  return (
    <div className="p-3 border-t border-border">
      <h3 className="text-xs font-semibold mb-2 text-muted-text">Legend</h3>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Client (DockNode)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Host</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>Container</span>
        </div>
      </div>
    </div>
  )
}

export default function GraphPage() {
  usePageHeading("Infrastructure Graph")

  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { data, isLoading, error, refetch } = useEdenQuery({
    queryKey: ["graphData"],
    route: api.graph.get,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Update nodes/edges when data changes
  useEffect(() => {
    if (data && !("success" in data && data.success === false)) {
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    }
  }, [data, setNodes, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const fitView = useCallback(() => {
    // Fit view would need a ref to ReactFlow instance
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card variant="elevated" className="p-6">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">Error Loading Graph</div>
            <div className="text-muted-text mb-4">{String(error)}</div>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  const hasNoData = !data || (data && "nodes" in data && data.nodes?.length === 0)

  return (
    <div className="h-[calc(100vh-140px)] w-full flex gap-4">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Card variant="flat" className="h-full flex flex-col">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Infrastructure
            </h2>
          </div>

          <div className="p-3 flex-1">
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-muted-text mb-2">Actions</h3>
                <div className="space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={fitView}
                  >
                    <Maximize2 className="h-3.5 w-3.5 mr-2" />
                    Fit View
                  </Button>
                </div>
              </div>

              <Divider />

              {/* Tunnel Placeholder */}
              <div>
                <h3 className="text-xs font-semibold text-muted-text mb-2">Tunnels</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start opacity-50"
                  disabled
                >
                  <Route className="h-3.5 w-3.5 mr-2" />
                  Create Tunnel
                </Button>
                <p className="text-xs text-muted-text mt-2">
                  Create secure tunnels between clients for direct communication.
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  Coming Soon
                </Badge>
              </div>
            </div>
          </div>

          <Legend />
        </Card>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
              <p className="text-muted-text">Loading infrastructure...</p>
            </div>
          </div>
        ) : hasNoData ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card variant="elevated" className="p-6 text-center">
              <Server className="h-12 w-12 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Infrastructure Data</h3>
              <p className="text-muted-text mb-4">
                Add DockNodes to visualize your infrastructure.
              </p>
            </Card>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Background gap={20} size={1} />
            <Controls position="bottom-right" />
            <MiniMap
              position="bottom-left"
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="!bg-muted/50"
            />

            <Panel position="top-left" className="flex gap-2">
              <StatsDisplay clients={data?.clients || []} hosts={data?.hosts || []} />
            </Panel>
          </ReactFlow>
        )}

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-10">
            <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
