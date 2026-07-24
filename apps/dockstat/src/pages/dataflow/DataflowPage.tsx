/**
 * Dataflow editor page — React Flow based data-pipe graph editor.
 *
 * Uses DataPipeNode / DataPipeEdge types that are directly compatible
 * with React Flow's Node / Edge, so there is zero conversion between
 * the database, the API, and the canvas.
 *
 * Routes:
 *   /dataflow/:id  —  edit the data-pipe for dashboard :id
 */

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import "@xyflow/react/dist/style.css"

import { Button } from "@dockstat/ui"
import type { DataPipeGraph, DataPipeNodeData, NodeTemplateDef } from "widgets/client"
import { usePageHeading } from "@/hooks/useHeading"
import { useDashboardQueries } from "@/hooks/queries/dashboard"
import { useDataflowMutations } from "@/hooks/mutations/dataflow"
import { NodePalette } from "./components/NodePalette"
import { createNodeData, PropertyPanel } from "./components/PropertyPanel"
import { dataPipeNodeTypes } from "./nodes/DataPipeNodes"

// Convenience alias: a React Flow Node carrying our typed data
type PipeNode = Node<DataPipeNodeData>

export default function DataflowPage() {
  const { id: dashboardId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  usePageHeading(`Dataflow ${dashboardId}`)

  // ── React Flow state (typed) ─────────────────────────────────────
  const [nodes, setNodes, onNodesChange] = useNodesState<PipeNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Load existing graph from API ──────────────────────────────────
  const { dashboardQuery } = useDashboardQueries(dashboardId)
  const { saveDataflowMutation, evaluateDataflowMutation } = useDataflowMutations()

  const loading = dashboardQuery.isLoading
  const saving = saveDataflowMutation.isPending || evaluateDataflowMutation.isPending

  // Load nodes and edges from dashboard dataPipe
  useMemo(() => {
    const dashboard = dashboardQuery.data as { dataPipe?: DataPipeGraph } | null
    const pipe = dashboard?.dataPipe
    if (pipe) {
      setNodes(pipe.nodes as PipeNode[])
      setEdges(pipe.edges as Edge[])
    }
  }, [dashboardQuery.data, setNodes, setEdges])

  // ── Selected node (derived from React Flow state) ─────────────────
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  )

  // ── Connection handling ───────────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds))
    },
    [setEdges]
  )

  // ── Add node from palette ─────────────────────────────────────────
  const onAddNode = useCallback(
    (template: NodeTemplateDef) => {
      const newNode: PipeNode = {
        data: createNodeData(template),
        id: `${template.typeKey}-${Date.now()}`,
        position: {
          x: 200 + Math.random() * 200,
          y: 150 + Math.random() * 200,
        },
        type: template.kind,
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  // ── Update node data ──────────────────────────────────────────────
  const onUpdateNodeData = useCallback(
    (id: string, patch: Partial<DataPipeNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)))
    },
    [setNodes]
  )

  // ── Delete node ───────────────────────────────────────────────────
  const onDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id))
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
      setSelectedNodeId(null)
    },
    [setNodes, setEdges]
  )

  // ── Save graph to API ─────────────────────────────────────────────
  const saveGraph = useCallback(async () => {
    if (!dashboardId) return
    setError(null)

    try {
      const graph: DataPipeGraph = {
        edges: edges as unknown as DataPipeGraph["edges"],
        nodes: nodes as unknown as DataPipeGraph["nodes"],
      }

      await saveDataflowMutation.mutateAsync({
        body: graph,
        params: { dashboardId },
      })

      // Trigger an evaluation so widgets update immediately
      await evaluateDataflowMutation.mutateAsync({
        body: undefined,
        params: { dashboardId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [dashboardId, nodes, edges, saveDataflowMutation, evaluateDataflowMutation])

  // ── Render ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-content">
        <p className="text-muted-foreground">Loading dataflow…</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dataflow Editor</h1>
            <p className="text-xs text-muted-foreground">Dashboard: {dashboardId}</p>
          </div>
          <div className="flex items-center gap-2">
            {error && <span className="text-sm text-red-500 mr-2">{error}</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/${dashboardId}`)}
            >
              ← Dashboard
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={saving}
              onClick={saveGraph}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Node Palette */}
        <div className="w-60 border-r bg-background overflow-y-auto shrink-0">
          <NodePalette onAddNode={onAddNode} />
        </div>

        {/* Center: Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            edges={edges}
            fitView
            nodes={nodes}
            nodeTypes={dataPipeNodeTypes}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onNodesChange={onNodesChange}
            onPaneClick={() => setSelectedNodeId(null)}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  connector: "#eab308",
                  output: "#a855f7",
                  provider: "#3b82f6",
                  transform: "#22c55e",
                }
                return colors[node.type ?? ""] ?? "#94a3b8"
              }}
            />
          </ReactFlow>
        </div>

        {/* Right: Property Panel */}
        <div className="w-72 border-l bg-background overflow-y-auto shrink-0">
          <PropertyPanel
            node={selectedNode}
            onChange={onUpdateNodeData}
            onDelete={onDeleteNode}
          />
        </div>
      </div>
    </div>
  )
}
