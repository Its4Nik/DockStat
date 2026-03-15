import type { GraphModel } from "../models/graph";
import type { DOCKER } from "@dockstat/typings";

// --- Types for React Flow Nodes ---

type NodeBaseData = {
  label: string;
  status: string;
  ipAddress?: string;
  port?: number;
};

type ClientNodeData = NodeBaseData & {
  clientId: number;
};

type HostNodeData = NodeBaseData & {
  clientId: number;
  hostId: number;
};

type DockNodeData = NodeBaseData & {
  dockNodeId: number;
};

type FlowNode =
  | {
      id: string;
      type: "client";
      position: { x: number; y: number };
      data: ClientNodeData;
    }
  | {
      id: string;
      type: "host";
      position: { x: number; y: number };
      data: HostNodeData;
    }
  | {
      id: string;
      type: "docknode";
      position: { x: number; y: number };
      data: DockNodeData;
    }
  | {
      id: string;
      type: "container";
      position: { x: number; y: number };
      data: {
        label: string;
        status: "online" | "offline";
        image: string;
        state: string;
        hostId: number;
        containerId: string;
      };
    };

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  style: { stroke: string };
};

export type DockNodeArray =
  (typeof GraphModel.GraphDataSchema.static)["dockNodes"];

export function calculateNodeLayout(
  clients: Array<{
    id: number;
    name: string;
    initialized: boolean;
  }>,
  hosts: Array<{
    name: string;
    id: number;
    clientId: number;
    reachable: boolean;
    host: string; // IP
    port: number;
  }>,
  dockNodes: DockNodeArray,
  containers: Array<DOCKER.ContainerInfo>,
) {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const nodeSpacingX = 300;
  const nodeSpacingY = 200;
  const startX = 50;
  const startY = 50;

  // 1. Create Client Nodes (Column 1)
  clients.forEach((client, index) => {
    const cY = startY + index * nodeSpacingY;

    nodes.push({
      id: `client-${client.id}`,
      type: "client",
      position: { x: startX, y: cY },
      data: {
        label: client.name || `Client ${client.id}`,
        status: client.initialized ? "online" : "offline",
        clientId: client.id,
      },
    });
  });

  // 2. Create Host Nodes (Column 2) and Edges
  hosts.forEach((host, hostIndex) => {
    const hX = startX + nodeSpacingX;
    const hY = startY + hostIndex * nodeSpacingY;

    nodes.push({
      id: `host-${host.clientId}-${host.id}`,
      type: "host",
      position: { x: hX, y: hY },
      data: {
        label: host.name || `Host ${host.id}`,
        status: host.reachable ? "online" : "offline",
        ipAddress: host.host,
        port: host.port,
        clientId: host.clientId,
        hostId: host.id,
      },
    });

    edges.push({
      id: `edge-client-${host.clientId}-host-${host.id}`,
      source: `client-${host.clientId}`,
      target: `host-${host.clientId}-${host.id}`,
      animated: host.reachable,
      style: { stroke: host.reachable ? "#10b981" : "#ef4444" },
    });
  });

  // 3. Create DockNode Nodes (Column 3)
  // DockNodes are independent, placed in a separate column
  dockNodes.forEach((dockNode, index) => {
    const dX = startX + nodeSpacingX * 2; // 3rd Column
    const dY = startY + index * nodeSpacingY;

    const isOnline = dockNode.reachable === "OK";

    nodes.push({
      id: `docknode-${dockNode.id}`,
      type: "docknode",
      position: { x: dX, y: dY },
      data: {
        label: dockNode.name || `DockNode ${dockNode.id}`,
        status: isOnline ? "online" : "offline",
        ipAddress: dockNode.hostname,
        port: dockNode.port,
        dockNodeId: dockNode.id,
      },
    });
  });

  // 4. Create Container Nodes (Column 4) and Edges to Hosts
  // We stack all containers in the 4th column, ordered by the array index.
  // Alternatively, you could group them by host Y-position, but stacking them
  // sequentially is often cleaner for generic graphs.
  containers.forEach((container, index) => {
    const cX = startX + nodeSpacingX * 3; // 4th Column
    const cY = startY + index * nodeSpacingY;

    const isRunning = container.state === "running";

    nodes.push({
      id: `container-${container.id}`, // Container ID is usually a string
      type: "container", // Ensure you have a 'container' node type registered
      position: { x: cX, y: cY },
      data: {
        label: container.name.replace(/^\//, ""), // Docker names often start with '/'
        status: isRunning ? "online" : "offline",
        image: container.image,
        state: container.state,
        hostId: container.hostId,
        containerId: container.id,
      },
    });

    // Create edge from Host to Container
    edges.push({
      id: `edge-host-${container.hostId}-container-${container.id}`,
      source: `host-${container.hostId}`, // Note: This ID format needs to match the Host Node ID logic above
      target: `container-${container.id}`,
      // We verify host ownership below before pushing, but here we assume the container belongs to the host ID it carries
      animated: isRunning,
      style: { stroke: isRunning ? "#10b981" : "#6b7280" },
    });
  });

  return { nodes, edges };
}
