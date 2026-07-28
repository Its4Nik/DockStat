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

import { Badge, Button } from "@dockstat/ui"
import { cn } from "@sglara/cn"
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
import { AlertCircle, ArrowLeft, Save, Workflow } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import "@xyflow/react/dist/style.css"

import { useEdenClient } from "@dockstat/utils/react"
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
  eden.const[(nodes, setNodes, onNodesChange)] = useNodesState<PipeNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Load existing graph from API ──────────────────────────────────
  const { dashboardQuery } = useDashboardQueries(dashboardId)
  const { saveDataflowMutation, evaluateDataflowMutation } = useDataflowMutations()

  const loading = dashboardQuery.isLoading
  const saving = saveDataflowMutation.isPending || evaluateDataflowMutation.isPending

  // Load nodes and edges from dashboard dataPipe.
  // MUST be useEffect, not useMemo — calling setState during render
  // triggers React's "Cannot update a component while rendering a
  // different component" warning and cascades re-renders.
  useEffect(() => {
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

  // ── Render ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
        <HeaderSkeleton />
        <div className="flex flex-1 items-center justify-center rounded-lg border border-card-default-border bg-card-flat-bg text-sm text-muted-text">
          Loading dataflow…
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-card-default-border bg-card-default-bg px-5 py-3 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Workflow size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-primary-text">Dataflow Editor</h2>
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {error && (
            <span className="flex items-center gap-1.5 rounded-md border border-error/40 bg-error/10 px-2.5 py-1 text-xs text-error">
              <AlertCircle size={14} />
              {error}
            </span>
          )}
          <Button
            onClick={() => navigate(`/dashboard/${dashboardId}`)}
            size="sm"
            variant="outline"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Button>
          <Button
            disabled={saving}
            loading={saving}
            onClick={saveGraph}
            size="sm"
            variant="primary"
          >
            <Save size={14} />
            Save
          </Button>
        </div>
      </header>

      {/* Body — 3-column editor */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Left: Node Palette */}
        <aside
          className={cn(
            "w-64 shrink-0 self-stretch overflow-hidden rounded-lg border border-card-default-border bg-card-flat-bg shadow-xl"
          )}
        >
          <NodePalette onAddNode={onAddNode} />
        </aside>

        {/*
          Center: Flow Canvas.
          ReactFlow requires a positioned, explicitly-sized parent, so we
          use a raw div with the same surface styling as a Card rather
          than the Card component (which doesn't take a `style` prop and
          would collapse to zero height without content).
        */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-card-default-border bg-main-bg shadow-xl">
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
              // Theme-aware colors. We pass CSS variables through so the
              // minimap re-skins automatically when the active @dockstat/ui
              // theme changes — without this the minimap falls back to
              // React Flow's default white background which looks broken
              // on dark themes.
              bgColor="var(--color-card-flat-bg)"
              maskColor="color-mix(in srgb, var(--color-main-bg) 70%, transparent)"
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  connector: "#eab308",
                  output: "#a855f7",
                  provider: "#3b82f6",
                  transform: "#22c55e",
                }
                return colors[node.type ?? ""] ?? "#94a3b8"
              }}
              style={{
                backgroundColor: "var(--color-card-flat-bg)",
                border: "1px solid var(--color-card-default-border)",
                borderRadius: "8px",
              }}
            />
          </ReactFlow>

          {/* Empty-state hint overlay (only when no nodes) */}
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-dashed border-card-default-border bg-card-flat-bg/80 px-6 py-4 text-center backdrop-blur-sm">
                <p className="text-sm font-medium text-secondary-text">Empty canvas</p>
                <p className="mt-1 text-xs text-muted-text">
                  Add nodes from the palette on the left to start wiring.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Property Panel */}
        <aside
          className={cn(
            "w-72 shrink-0 self-stretch overflow-hidden rounded-lg border border-card-default-border bg-card-flat-bg shadow-xl"
          )}
        >
          <PropertyPanel
            node={selectedNode}
            onChange={onUpdateNodeData}
            onDelete={onDeleteNode}
          />
        </aside>
      </div>
    </div>
  )
}

// ── Loading placeholder for the header ──────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-card-default-border bg-card-default-bg px-5 py-4 shadow-xl">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-card-flat-bg" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 animate-pulse rounded bg-card-flat-bg" />
        <div className="h-3 w-64 animate-pulse rounded bg-card-flat-bg" />
      </div>
    </div>
  )
}
