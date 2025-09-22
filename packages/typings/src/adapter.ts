import type Docker from "dockerode";
import type { DockerAdapterOptions } from "./docker-client";

export type ContainerId = string;

export type Type = "docker"

export type AdapterTable = {
  id: number;
  name: string;
  type: Type;
  config: DockerAdapterOptions;
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
