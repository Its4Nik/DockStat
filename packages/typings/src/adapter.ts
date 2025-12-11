import type { DockerAdapterOptions } from "./docker-client"

export type ContainerId = string

export type Type = "docker"

export type AdapterTable = {
  id: number
  name: string
  type: Type
  config: DockerAdapterOptions
}

export interface LogChunk {
  containerId: ContainerId
  stream: "stdout" | "stderr"
  data: Buffer
  timestamp: number
}

export interface ContainerStatsSnapshot {
  read: string // timestamp string returned by docker stats
  preread?: string
  cpu_stats: unknown
  precpu_stats?: unknown
  memory_stats: unknown
  networks?: Record<string, unknown>
  pids_stats?: unknown
  [k: string]: unknown
}

export interface NetworkStats {
  Id: string
  Name: string
  Containers: Record<string, { Name: string; IPv4Address?: string; IPv6Address?: string }>
  Options?: Record<string, string>
  Labels?: Record<string, string>
}
