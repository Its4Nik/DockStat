import { Badge, Button, Card, Divider, nodeTypes } from "@dockstat/ui"
import {
  Background,
  BackgroundVariant,
  BezierEdge,
  type Edge,
  type Node,
  Panel,
  ReactFlow,
  SimpleBezierEdge,
  SmoothStepEdge,
  StepEdge,
  StraightEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { MapPin, Maximize2, RefreshCw, Route, Server } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { api } from "@/lib/api"
import DockStatLabelEdge from "./customEdge"
import { Legend } from "./legend"
import { NodeDetailsPanel } from "./nodeDetails"
import { StatsDisplay } from "./statsDisplay"

export function GraphFlow() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { fitView } = useReactFlow()

  const { data, isLoading, error, refetch } = useEdenQuery({
    queryKey: ["graphData"],
    route: api.graph.get,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (data && !("success" in data && data.success === false)) {
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    }
  }, [data, setNodes, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
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
      <div className="w-64 shrink-0">
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
                    onClick={() => fitView({ padding: 0.2 })}
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
                Add Clients, Hosts, or DockNodes to visualize your infrastructure.
              </p>
            </Card>
          </div>
        ) : (
          <ReactFlow
            edgesReconnectable={false}
            nodes={nodes}
            edges={edges}
            edgeTypes={{
              default: BezierEdge,
              straight: StraightEdge,
              step: StepEdge,
              smoothstep: SmoothStepEdge,
              simplebezier: SimpleBezierEdge,
              dockstat: DockStatLabelEdge,
            }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            autoPanOnNodeFocus
          >
            <Background gap={40} size={1} variant={BackgroundVariant.Dots} />

            <Panel position="top-left" className="flex gap-2">
              {data && (
                <StatsDisplay
                  containers={data.containers || []}
                  clients={data.clients || []}
                  hosts={data.hosts || []}
                  dockNodes={data.dockNodes || []}
                />
              )}
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
