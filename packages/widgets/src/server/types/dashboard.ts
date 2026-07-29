import type { BreakpointLayouts, PlacedWidget } from "./widget"
import type { Edge, Node } from "@xyflow/react"

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

// ── Data Pipe Graph (react-flow compatible) ─────────────────────────
//
// DataPipeNode and DataPipeEdge are **directly compatible** with
// React Flow's Node / Edge types — no conversion needed when moving
// between the database, the API, the WebSocket, and the canvas.
//
// The node *kind* (provider / transform / connector / output) lives
// in `type` (React Flow's built-in field that selects the renderer).
// The node *configuration* lives in `data` as a typed DataPipeNodeData.

export interface DataPipeGraph {
  nodes: DataPipeNode[]
  edges: DataPipeEdge[]
}

/**
 * Typed configuration carried inside a React Flow Node's `data` field.
 *
 * Known fields are optional because different node kinds use different
 * subsets.  The index signature (`[key: string]: unknown`) keeps the
 * type compatible with React Flow's `Record<string, unknown>` constraint
 * while still giving IDE autocomplete and compile-time checks for the
 * common keys.
 */
export interface DataPipeNodeData extends Record<string, unknown> {
  /** Human-readable label shown on the node card */
  label: string

  // ── Type discriminators (used by the engine to pick the impl) ──
  /** For provider nodes: which DataProvider implementation to invoke */
  providerType?: string
  /** For transform nodes: which DataTransformer implementation to invoke */
  transformType?: string

  // ── Provider configs ──────────────────────────────────────────
  /** static provider: the fixed value to emit */
  value?: unknown
  /** websocket-source provider: the pub/sub topic to subscribe to */
  topic?: string
  /** websocket-source provider: value used before first message */
  fallback?: unknown

  // ── Transform configs ─────────────────────────────────────────
  /** jsonPath: dot-separated path e.g. "data.containers" */
  path?: string
  /** arrayFilter / aggregate / sort: the field to operate on */
  field?: string
  /** arrayFilter: comparison operator */
  operator?: "eq" | "neq" | "gt" | "lt"
  /** arrayFilter: the value to compare against */
  filterValue?: unknown
  /** expression: JS expression where `$` = input */
  expression?: string
  /** aggregate / groupBy / window / pivot: which aggregation to perform */
  operation?: "sum" | "avg" | "min" | "max" | "count" | "first" | "last"
  /** sort: ascending or descending */
  direction?: "asc" | "desc"
  /** pick: comma-separated field names to keep */
  fields?: string
  /** format: what kind of formatting to apply */
  format?: "number" | "percentage" | "date" | "bytes"
  /** format: decimal places */
  decimals?: number

  // ── Advanced transform configs ─────────────────────────────────
  /** flatten: max depth to flatten nested arrays */
  depth?: number
  /** pivot: field used as the row key */
  rowField?: string
  /** pivot: field used as the column key */
  colField?: string
  /** pivot: field used as the cell value */
  valueField?: string
  /** topN: number of records to keep */
  count?: number
  /** window: sliding window size */
  size?: number
  /** mapFields: mapping of old field name → new field name */
  mapping?: unknown
  /** groupBy: per-field aggregation spec ({ field: "operation" }) */
  aggregations?: unknown

  // ── Output configs ────────────────────────────────────────────
  /** output: the data-output key that widgets consume */
  key?: string
}

/**
 * A data-pipe node.
 *
 * This is `Node<DataPipeNodeData>` from React Flow with `type` made
 * required (every pipe node must declare its kind).  It can be passed
 * directly to `<ReactFlow nodes={…} />` without any mapping.
 */
export type DataPipeNode = Node<DataPipeNodeData> & {
  type: string // override React Flow's optional → required
}

/**
 * A data-pipe edge.
 *
 * Directly compatible with React Flow's `Edge` type.
 */
export type DataPipeEdge = Edge

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
