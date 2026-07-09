import type { BreakpointLayouts, PlacedWidget } from "./widget"

// ── Dashboard Definition (stored in DB) ────────────────────────────

export interface DashboardDefinition {
  id: string
  /** Human-readable slug */
  name: string
  /** Display label */
  label: string
  /** Markdown or plain-text description */
  description: string
  /** Ordered list of placed widgets */
  widgets: PlacedWidget[]
  /** react-grid-layout breakpoint-resp. layouts */
  layouts: BreakpointLayouts
  /**
   * react-flow-xy graph definition describing the data-pipe wiring
   * for this dashboard.  Serialized as JSON.
   */
  dataPipe: DataPipeGraph
  /** Whether this is the system-default dashboard */
  isDefault: boolean
  /** ISO-8601 timestamps */
  createdAt: string
  updatedAt: string
}

// ── Data Pipe Graph (react-flow-xy compatible) ─────────────────────

export interface DataPipeGraph {
  nodes: DataPipeNode[]
  edges: DataPipeEdge[]
}

export interface DataPipeNode {
  id: string
  /**
   * The kind of node.  Built-in kinds:
   *   - "provider"   – external data source
   *   - "transform"  – data transformation / mapping
   *   - "connector"  – routes data between providers & widgets
   *   - "output"     – terminal node (widget input)
   *
   * Custom kinds may be added by imported widget packs.
   */
  type: string
  /** Human-readable label shown on the node */
  label: string
  /** Position on the react-flow canvas */
  position: { x: number; y: number }
  /** Node-specific configuration */
  data: Record<string, unknown>
}

export interface DataPipeEdge {
  id: string
  source: string
  target: string
  /** Label for the connection */
  label?: string
  /** Source handle id (maps to a data-output key) */
  sourceHandle?: string
  /** Target handle id (maps to a data-input key) */
  targetHandle?: string
  /** Edge-specific configuration (throttle, transform, etc.) */
  data?: Record<string, unknown>
}

// ── Data that flows through the pipe ────────────────────────────────

export interface DataPayload {
  /** Which data-output key produced this payload */
  key: string
  /** Arbitrary payload value */
  value: unknown
  /** ISO-8601 timestamp when this payload was produced */
  timestamp: string
  /** Node id that emitted this payload */
  sourceNodeId: string
}
