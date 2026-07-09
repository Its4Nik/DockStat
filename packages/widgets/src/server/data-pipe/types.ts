import type { DataPipeEdge, DataPipeNode } from "../types"

// ── Execution context for a single graph evaluation ─────────────────

export interface PipeContext {
  /** The graph being executed */
  graph: { nodes: DataPipeNode[]; edges: DataPipeEdge[] }
  /** Resolved output values per node id */
  values: Map<string, unknown>
  /** Timestamp of this evaluation tick */
  timestamp: string
  /** Errors encountered during this evaluation */
  errors: Array<{ nodeId: string; message: string }>
}

// ── Provider interface ─────────────────────────────────────────────

/**
 * A DataProvider is a pluggable class that produces data for the pipe.
 * Each provider is associated with one or more DataPipeNodes of type "provider".
 */
export abstract class DataProvider {
  abstract readonly type: string

  /**
   * Called when a provider node needs to produce data.
   * Return the value that should propagate downstream.
   */
  abstract execute(node: DataPipeNode, context: PipeContext): Promise<unknown> | unknown

  /**
   * Optional cleanup when the provider is removed from the graph.
   */
  dispose?(): void
}

// ── Transform interface ─────────────────────────────────────────────

/**
 * A DataTransformer transforms data as it flows through the pipe.
 */
export abstract class DataTransformer {
  abstract readonly type: string

  abstract execute(
    input: unknown,
    node: DataPipeNode,
    context: PipeContext
  ): Promise<unknown> | unknown

  dispose?(): void
}

// ── Subscription handle ────────────────────────────────────────────

export interface PipeSubscription {
  /** Unique subscription id */
  id: string
  /** The dashboard id this subscription is for */
  dashboardId: string
  /** Cleanup function */
  unsubscribe: () => void
}
