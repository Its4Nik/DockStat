/**
 * DataPipeEngine — evaluates data-pipe graphs and propagates data.
 *
 * The engine:
 *   1. Topologically sorts the nodes in the graph.
 *   2. Executes each node in order (providers → transforms → outputs).
 *   3. Propagates values along edges.
 *   4. Emits results to subscribers via the provided callback.
 *
 * The engine is designed to be used in a periodic polling loop
 * or triggered on-demand.
 */

import type { Logger } from "@dockstat/logger"
import type { DataPayload, DataPipeEdge, DataPipeGraph, DataPipeNode } from "../types"
import type { DataProvider, DataTransformer, PipeContext } from "./types"

export type DataUpdateCallback = (dashboardId: string, payloads: DataPayload[]) => void

export class DataPipeEngine {
  private providers = new Map<string, DataProvider>()
  private transformers = new Map<string, DataTransformer>()
  private log: Logger

  /** Intervals keyed by dashboard id for cleanup */
  private activeIntervals = new Map<string, ReturnType<typeof setInterval>>()

  constructor(baseLogger: Logger) {
    this.log = baseLogger.spawn("DPE")
  }

  // ── Provider / Transformer registration ───────────────────────────

  registerProvider(provider: DataProvider): void {
    if (this.providers.has(provider.type)) {
      this.log.warn(`Overwriting existing provider of type "${provider.type}"`)
    }
    this.providers.set(provider.type, provider)
    this.log.info(`Registered data provider: ${provider.type}`)
  }

  registerTransformer(transformer: DataTransformer): void {
    if (this.transformers.has(transformer.type)) {
      this.log.warn(`Overwriting existing transformer of type "${transformer.type}"`)
    }
    this.transformers.set(transformer.type, transformer)
    this.log.info(`Registered data transformer: ${transformer.type}`)
  }

  unregisterProvider(type: string): void {
    const provider = this.providers.get(type)
    if (provider) {
      provider.dispose?.()
      this.providers.delete(type)
      this.log.info(`Unregistered data provider: ${type}`)
    }
  }

  unregisterTransformer(type: string): void {
    const transformer = this.transformers.get(type)
    if (transformer) {
      transformer.dispose?.()
      this.transformers.delete(type)
      this.log.info(`Unregistered data transformer: ${type}`)
    }
  }

  // ── Single evaluation tick ───────────────────────────────────────

  /**
   * Evaluate a data-pipe graph for a dashboard and return all
   * DataPayloads that were produced.
   */
  async evaluate(dashboardId: string, graph: DataPipeGraph): Promise<DataPayload[]> {
    const { nodes, edges } = graph

    if (nodes.length === 0) return []

    const context: PipeContext = {
      errors: [],
      graph: { edges, nodes },
      timestamp: new Date().toISOString(),
      values: new Map(),
    }

    // Build adjacency list (source → outgoing edges)
    const outgoing = new Map<string, DataPipeEdge[]>()
    for (const edge of edges) {
      const list = outgoing.get(edge.source) ?? []
      list.push(edge)
      outgoing.set(edge.source, list)
    }

    // Topological sort
    const sorted = this.topologicalSort(nodes, edges)

    // Execute each node in topological order
    for (const nodeId of sorted) {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) continue

      try {
        const value = await this.executeNode(node, context)
        context.values.set(nodeId, value)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        context.errors.push({ message, nodeId })
        this.log.warn(`Node "${nodeId}" execution failed: ${message}`)
      }
    }

    // Build payloads from output-type nodes
    const payloads: DataPayload[] = []
    for (const node of nodes) {
      if (node.type === "output" && context.values.has(node.id)) {
        payloads.push({
          key: node.data.key ?? node.id,
          sourceNodeId: node.id,
          timestamp: context.timestamp,
          value: context.values.get(node.id),
        })
      }
    }

    return payloads
  }

  // ── Periodic evaluation ────────────────────────────────────────────

  /**
   * Start a periodic evaluation loop for a dashboard's data pipe.
   * Returns an unsubscribe function.
   */
  startPolling(
    dashboardId: string,
    graph: DataPipeGraph,
    intervalMs: number,
    onUpdate: DataUpdateCallback
  ): () => void {
    if (this.activeIntervals.has(dashboardId)) {
      this.stopPolling(dashboardId)
    }

    const interval = setInterval(async () => {
      try {
        const payloads = await this.evaluate(dashboardId, graph)
        if (payloads.length > 0) {
          onUpdate(dashboardId, payloads)
        }
      } catch (error) {
        this.log.error(
          `Polling error for dashboard "${dashboardId}": ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }, intervalMs)

    this.activeIntervals.set(dashboardId, interval)
    this.log.info(`Started polling for dashboard "${dashboardId}" (every ${intervalMs}ms)`)

    return () => this.stopPolling(dashboardId)
  }

  stopPolling(dashboardId: string): void {
    const interval = this.activeIntervals.get(dashboardId)
    if (interval) {
      clearInterval(interval)
      this.activeIntervals.delete(dashboardId)
      this.log.info(`Stopped polling for dashboard "${dashboardId}"`)
    }
  }

  stopAllPolling(): void {
    for (const id of this.activeIntervals.keys()) {
      this.stopPolling(id)
    }
  }

  // ── Internal helpers ─────────────────────────────────────────────

  private async executeNode(node: DataPipeNode, context: PipeContext): Promise<unknown> {
    const { edges } = context.graph
    const incoming = edges.filter((e) => e.target === node.id)

    switch (node.type) {
      case "provider": {
        const providerKey = node.data.providerType ?? (node.data.type as string | undefined)
        if (!providerKey) {
          throw new Error(`Provider node "${node.id}" has no providerType`)
        }
        const provider = this.providers.get(providerKey)
        if (!provider) {
          throw new Error(`No provider registered for type "${providerKey}"`)
        }
        return provider.execute(node.data, node, context)
      }

      case "transform": {
        // Collect input from the first incoming edge
        const inputValue = incoming.length > 0 ? context.values.get(incoming[0]!.source) : undefined

        const transformKey = node.data.transformType ?? (node.data.type as string | undefined)
        if (!transformKey) {
          throw new Error(`Transform node "${node.id}" has no transformType`)
        }
        const transformer = this.transformers.get(transformKey)
        if (!transformer) {
          throw new Error(`No transformer registered for type "${transformKey}"`)
        }
        return transformer.execute(inputValue, node.data, node, context)
      }

      case "connector": {
        // A connector simply passes data through
        const inputValue = incoming.length > 0 ? context.values.get(incoming[0]!.source) : undefined
        return inputValue
      }

      case "output": {
        // An output node collects its input
        const inputValue = incoming.length > 0 ? context.values.get(incoming[0]!.source) : undefined
        return inputValue
      }

      default:
        throw new Error(`Unknown node type "${node.type}"`)
    }
  }

  private topologicalSort(nodes: DataPipeNode[], edges: DataPipeEdge[]): string[] {
    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()

    for (const node of nodes) {
      inDegree.set(node.id, 0)
      adjacency.set(node.id, [])
    }

    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    }

    const queue: string[] = []
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id)
    }

    const sorted: string[] = []
    while (queue.length > 0) {
      const current = queue.shift()!
      sorted.push(current)

      for (const neighbor of adjacency.get(current) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1
        inDegree.set(neighbor, newDegree)
        if (newDegree === 0) queue.push(neighbor)
      }
    }

    return sorted
  }

  dispose(): void {
    this.stopAllPolling()
    for (const provider of this.providers.values()) {
      provider.dispose?.()
    }
    for (const transformer of this.transformers.values()) {
      transformer.dispose?.()
    }
    this.providers.clear()
    this.transformers.clear()
  }
}
