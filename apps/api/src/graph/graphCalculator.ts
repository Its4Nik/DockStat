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
    marginx: 50,
    marginy: 50,
    nodesep: 20,
    rankdir: "LR",
    ranksep: 50,
  })
  g.setDefaultEdgeLabel(() => ({}))

  const addNodeToGraph = (id: string, type: "Client" | "Host" | "Container" | "DockNode") => {
    logger.debug(`Registering node in Dagre: [${type}] ${id}`)
    g.setNode(id, { height: 80, width: 250 })
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
      data: {
        clientId: client.id,
        label: client.name || `Client ${client.id}`,
        status: client.initialized ? "online" : "offline",
      },
      id: nodeId,
      position: calculatePosition(dagreNode),
      type: "client",
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
      data: {
        clientId: host.clientId,
        hostId: host.id,
        ipAddress: host.host,
        label: host.name || `Host ${host.id}`,
        port: host.port,
        status: host.reachable ? "online" : "offline",
      },
      id: nodeId,
      position: calculatePosition(dagreNode),
      type: "host",
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
      data: {
        containerId: container.id,
        hostId: container.hostId,
        image: container.image,
        label: container.name.replace(/^\//, ""),
        state: container.state,
        status: isRunning ? "online" : "offline",
      },
      id: nodeId,
      position: calculatePosition(dagreNode),
      type: "container",
    })

    const hostNodeId = getHostId(container.clientId, container.hostId)
    if (g.hasNode(hostNodeId)) {
      edges.push({
        ...createEdge(
          hostNodeId,
          nodeId,
          isRunning,
          getContainerEdgeStrokeColor(isRunning),
          container.state !== "running" ? container.state : undefined
        ),
        type: "dockstat",
      })
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
      data: {
        dockNodeId: dockNode.id,
        ipAddress: dockNode.hostname,
        label: dockNode.name || `DockNode ${dockNode.id}`,
        port: dockNode.port,
        status: isOnline ? "online" : "offline",
      },
      id: nodeId,
      position: calculatePosition(dagreNode),
      type: "docknode",
    })
  })

  logger.info(`Graph layout finished. Generated ${nodes.length} nodes and ${edges.length} edges.`)

  return { edges, nodes }
}
