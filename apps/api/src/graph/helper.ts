// graphHelpers.ts
import BaseLogger from "../logger"
import type { FlowEdge } from "./types"

const logger = BaseLogger.spawn("GraphHelpers")

export const getClientId = (id: number) => `client-${id}`
export const getHostId = (clientId: number, hostId: number) => `host-${clientId}-${hostId}`
export const getContainerId = (id: string) => `container-${id}`
export const getDockNodeId = (id: number) => `docknode-${id}`

export const getEdgeStrokeColor = (isOnline: boolean) => (isOnline ? "#10b981" : "#ef4444")

export const getContainerEdgeStrokeColor = (isRunning: boolean) =>
  isRunning ? "var(--color-success)" : "var(--color-error)"

/**
 * Creates a standardized edge object for the graph.
 */
export const createEdge = (
  source: string,
  target: string,
  isAnimated: boolean,
  strokeColor: string,
  label?: string
): FlowEdge => {
  const edgeId = `edge-${source}-${target}`
  logger.debug(`Generated edge: ${edgeId}`)
  return {
    animated: isAnimated,
    edgesReconnectable: false,
    id: edgeId,
    label,
    source,
    style: { stroke: strokeColor },
    target,
  }
}

/**
 * Calculates the top-left position from a Dagre node (which provides center coordinates).
 */
export const calculatePosition = (dagreNode: {
  x: number
  y: number
  width: number
  height: number
}) => {
  return {
    x: dagreNode.x - dagreNode.width / 2,
    y: dagreNode.y - dagreNode.height / 2,
  }
}
