import dagre from "dagre"
import BaseLogger from "../logger"
import {
  calculatePosition,
  createEdge,
  getClientId,
  getContainerEdgeStrokeColor,
  getContainerId,
  getDockNodeId,
  getEdgeStrokeColor,
  getHostId,
} from "./helper"
import type { FlowEdge, FlowNode, GraphInput } from "./types"

const logger = BaseLogger.spawn("GraphCalc")

export function calculateNodeLayout(input: GraphInput): {
  nodes: FlowNode[]
  edges: FlowEdge[]
} {
  const { clients, hosts, dockNodes, containers } = input

  logger.info("Starting graph layout calculation...")
  logger.debug(
    `Input counts: Clients=${clients.length}, Hosts=${hosts.length}, DockNodes=${dockNodes.length}, Containers=${containers.length}`
  )

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: "LR",
    nodesep: 20,
    ranksep: 50,
    marginx: 50,
    marginy: 50,
  })
  g.setDefaultEdgeLabel(() => ({}))

  const addNodeToGraph = (id: string, type: "Client" | "Host" | "Container" | "DockNode") => {
    logger.debug(`Registering node in Dagre: [${type}] ${id}`)
    g.setNode(id, { width: 250, height: 80 })
  }

  logger.info("Registering nodes...")
  for (const c of clients) addNodeToGraph(getClientId(c.id), "Client")
  for (const h of hosts) addNodeToGraph(getHostId(h.clientId, h.id), "Host")
  for (const co of containers) addNodeToGraph(getContainerId(co.id), "Container")
  for (const d of dockNodes) addNodeToGraph(getDockNodeId(d.id), "DockNode")

  // 3. Add Edges to Dagre Graph (for layout positioning only)
  logger.info("Registering edges for layout calculation...")

  hosts.forEach((host) => {
    const source = getClientId(host.clientId)
    const target = getHostId(host.clientId, host.id)
    g.setEdge(source, target)
  })

  containers.forEach((container) => {
    const source = getHostId(container.clientId, container.hostId)
    const target = getContainerId(container.id)

    if (g.hasNode(source)) {
      g.setEdge(source, target)
    } else {
      logger.warn(`Container ${container.id} references non-existent Host ${source}. Edge skipped.`)
    }
  })

  logger.info("Running Dagre layout algorithm...")
  dagre.layout(g)
  logger.info("Dagre layout complete.")

  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  clients.forEach((client) => {
    const nodeId = getClientId(client.id)
    const dagreNode = g.node(nodeId)

    if (!dagreNode) {
      logger.error(`Missing node in Dagre output: ${nodeId}`)
      return
    }

    nodes.push({
      id: nodeId,
      type: "client",
      position: calculatePosition(dagreNode),
      data: {
        label: client.name || `Client ${client.id}`,
        status: client.initialized ? "online" : "offline",
        clientId: client.id,
      },
    })
  })

  hosts.forEach((host) => {
    const nodeId = getHostId(host.clientId, host.id)
    const dagreNode = g.node(nodeId)

    if (!dagreNode) {
      logger.error(`Missing node in Dagre output: ${nodeId}`)
      return
    }

    nodes.push({
      id: nodeId,
      type: "host",
      position: calculatePosition(dagreNode),
      data: {
        label: host.name || `Host ${host.id}`,
        status: host.reachable ? "online" : "offline",
        ipAddress: host.host,
        port: host.port,
        clientId: host.clientId,
        hostId: host.id,
      },
    })

    edges.push(
      createEdge(
        getClientId(host.clientId),
        nodeId,
        host.reachable,
        getEdgeStrokeColor(host.reachable)
      )
    )
  })

  containers.forEach((container) => {
    const nodeId = getContainerId(container.id)
    const dagreNode = g.node(nodeId)

    if (!dagreNode) {
      logger.error(`Missing node in Dagre output: ${nodeId}`)
      return
    }

    const isRunning = container.state === "running"

    nodes.push({
      id: nodeId,
      type: "container",
      position: calculatePosition(dagreNode),
      data: {
        label: container.name.replace(/^\//, ""),
        status: isRunning ? "online" : "offline",
        image: container.image,
        state: container.state,
        hostId: container.hostId,
        containerId: container.id,
      },
    })

    const hostNodeId = getHostId(container.clientId, container.hostId)
    if (g.hasNode(hostNodeId)) {
      edges.push(createEdge(hostNodeId, nodeId, isRunning, getContainerEdgeStrokeColor(isRunning)))
    }
  })

  dockNodes.forEach((dockNode) => {
    const nodeId = getDockNodeId(dockNode.id)
    const dagreNode = g.node(nodeId)

    if (!dagreNode) {
      logger.error(`Missing node in Dagre output: ${nodeId}`)
      return
    }

    const isOnline = dockNode.reachable === "OK"

    nodes.push({
      id: nodeId,
      type: "docknode",
      position: calculatePosition(dagreNode),
      data: {
        label: dockNode.name || `DockNode ${dockNode.id}`,
        status: isOnline ? "online" : "offline",
        ipAddress: dockNode.hostname,
        port: dockNode.port,
        dockNodeId: dockNode.id,
      },
    })
  })

  logger.info(`Graph layout finished. Generated ${nodes.length} nodes and ${edges.length} edges.`)

  return { nodes, edges }
}
