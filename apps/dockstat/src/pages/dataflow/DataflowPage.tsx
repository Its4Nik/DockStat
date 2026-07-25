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

import { Badge, Button, Card, CardBody } from "@dockstat/ui"
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

import type { DataPipeGraph, DataPipeNodeData, NodeTemplateDef } from "widgets/client"
import { useDataflowMutations } from "@/hooks/mutations/dataflow"
import { useDashboardQueries } from "@/hooks/queries/dashboard"
import { usePageHeading } from "@/hooks/useHeading"
import { NodePalette } from "./components/NodePalette"
import { createNodeData, PropertyPanel } from "./components/PropertyPanel"
import { dataPipeNodeTypes } from "./nodes/DataPipeNodes"

// Convenience alias: a React Flow Node carrying our typed data
type PipeNode = Node<DataPipeNodeData>

/**
 * Convert the in-memory React Flow graph into the data-pipe API wire
 * format expected by `PUT /data-pipe/:dashboardId`.
 *
 * This exists because React Flow's `Edge.label` is a `ReactNode` (so
 * the canvas can render React elements as labels), while the
 * persisted/API representation only supports string labels. Mapping
 * here keeps the treaty client's inferred body type happy without any
 * `as unknown as` casts and makes the in-memory → wire conversion
 * explicit and intentional.
 */
function serializeDataPipeGraph(nodes: PipeNode[], edges: Edge[]) {
  return {
    edges: edges.map((edge) => ({
      data: edge.data as Record<string, unknown> | undefined,
      id: edge.id,
      label: typeof edge.label === "string" ? edge.label : undefined,
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? undefined,
      target: edge.target,
      targetHandle: edge.targetHandle ?? undefined,
    })),
    nodes: nodes.map((node) => ({
      data: node.data,
      id: node.id,
      position: node.position,
      type: node.type ?? "",
    })),
  }
}

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
      await saveDataflowMutation.mutateAsync({
        body: serializeDataPipeGraph(nodes, edges),
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
      <Card variant="flat">
        <CardBody>Loading dataflow…</CardBody>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <Card variant="flat">
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-primary-text">Dataflow Editor</h2>
              <Badge
                outlined
                size="xs"
                variant="secondary"
              >
                {dashboardId}
              </Badge>
            </div>
            <p className="text-xs text-muted-text">
              Wire data sources through transforms into outputs that widgets consume.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {error && <span className="text-sm text-error">{error}</span>}
            <Button
              onClick={() => navigate(`/dashboard/${dashboardId}`)}
              size="sm"
              variant="outline"
            >
              ← Dashboard
            </Button>
            <Button
              disabled={saving}
              loading={saving}
              onClick={saveGraph}
              size="sm"
              variant="primary"
            >
              Save
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Body — 3-column editor */}
      <div className="flex gap-4">
        {/* Left: Node Palette */}
        <Card
          className="w-64 shrink-0 self-start overflow-hidden"
          variant="flat"
        >
          <NodePalette onAddNode={onAddNode} />
        </Card>

        {/*
          Center: Flow Canvas.
          ReactFlow requires a positioned, explicitly-sized parent, so we
          use a raw div with the same surface styling as a Card rather
          than the Card component (which doesn't take a `style` prop and
          would collapse to zero height without content).
        */}
        <div
          className="relative flex-1 overflow-hidden rounded-lg border border-card-outlined-border bg-main-bg shadow-xl"
          style={{ height: "70vh", minHeight: "500px" }}
        >
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
        <Card
          className="w-72 shrink-0 self-start overflow-hidden"
          variant="flat"
        >
          <PropertyPanel
            node={selectedNode}
            onChange={onUpdateNodeData}
            onDelete={onDeleteNode}
          />
        </Card>
      </div>
    </div>
  )
}
