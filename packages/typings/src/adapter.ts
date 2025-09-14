import type Docker from "dockerode";
import type { DockerClientOptions } from "./docker-client";

export type ContainerId = string;

export type Type = "docker"

export type AdapterTable = {
  id: number;
  name: string;
  type: Type;
  config: DockerClientOptions;
}

export interface LogChunk {
  containerId: ContainerId;
  stream: "stdout" | "stderr";
  data: Buffer;
  timestamp: number;
}

export interface ContainerStatsSnapshot {
  read: string; // timestamp string returned by docker stats
  preread?: string;
  cpu_stats: any;
  precpu_stats?: any;
  memory_stats: any;
  networks?: Record<string, any>;
  pids_stats?: any;
  [k: string]: any;
}

export interface NetworkStats {
  Id: string;
  Name: string;
  Containers: Record<string, { Name: string; IPv4Address?: string; IPv6Address?: string }>;
  Options?: Record<string, string>;
  Labels?: Record<string, string>;
}

export interface DockerAdapterOptions {
  socketPath?: string;
  host?: string;
  port?: number;
  protocol?: "http" | "https";
  ca?: Buffer | string;
  cert?: Buffer | string;
  key?: Buffer | string;
  // timeout in ms for requests
  timeout?: number;
}
