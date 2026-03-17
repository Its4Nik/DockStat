import type { DOCKER } from "@dockstat/typings";
import type { GraphModel } from "../models/graph";

export type NodeBaseData = {
  label: string;
  status: string;
  ipAddress?: string;
  port?: number;
};

export type ClientNodeData = NodeBaseData & {
  clientId: number;
};

export type HostNodeData = NodeBaseData & {
  clientId: number;
  hostId: number;
};

export type DockNodeData = NodeBaseData & {
  dockNodeId: number;
};

export type ContainerNodeData = {
  label: string;
  status: "online" | "offline";
  image: string;
  state: string;
  hostId: number;
  containerId: string;
};

export type FlowNode =
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
      data: ContainerNodeData;
    };

export type FlowEdge = {
  id: string;
  edgesReconnectable: false;
  source: string;
  target: string;
  animated: boolean;
  style: { stroke: string };
  label?: string;
  type?: "dockstat";
};

export type DockNodeArray =
  (typeof GraphModel.GraphDataSchema.static)["dockNodes"];

export type GraphInput = {
  clients: Array<{
    id: number;
    name: string;
    initialized: boolean;
  }>;
  hosts: Array<{
    name: string;
    id: number;
    clientId: number;
    reachable: boolean;
    host: string;
    port: number;
  }>;
  dockNodes: DockNodeArray;
  containers: Array<DOCKER.ContainerInfo>;
};
