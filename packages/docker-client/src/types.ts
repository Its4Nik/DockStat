import type { DATABASE, DOCKER } from "@dockstat/typings"
import { HeapStats } from "bun:jsc"

export type WorkerRequestBase = {
  requestId?: string
}

export type WorkerRequest = WorkerRequestBase &
  (
    | { type: "init"; hosts: DATABASE.DB_target_host[] }
    | { type: "ping" }
    | {
        type: "addHost"
        data: DATABASE.DB_target_host
      }
    | { type: "removeHost"; hostId: number }
    | {
        type: "updateHost"
        host: DATABASE.DB_target_host
      }
    | { type: "getHosts" }
    | { type: "getAllContainers" }
    | { type: "getContainersForHost"; hostId: number }
    | { type: "getContainer"; hostId: number; containerId: string }
    | { type: "getAllContainerStats" }
    | { type: "getContainerStatsForHost"; hostId: number }
    | { type: "getContainerStats"; hostId: number; containerId: string }
    | { type: "getAllHostMetrics" }
    | { type: "getHostMetrics"; hostId: number }
    | { type: "getAllStats" }
    | { type: "startContainer"; hostId: number; containerId: string }
    | { type: "stopContainer"; hostId: number; containerId: string }
    | { type: "restartContainer"; hostId: number; containerId: string }
    | {
        type: "removeContainer"
        hostId: number
        containerId: string
        force?: boolean
      }
    | { type: "pauseContainer"; hostId: number; containerId: string }
    | { type: "unpauseContainer"; hostId: number; containerId: string }
    | {
        type: "killContainer"
        hostId: number
        containerId: string
        signal?: string
      }
    | {
        type: "renameContainer"
        hostId: number
        containerId: string
        newName: string
      }
    | {
        type: "getContainerLogs"
        hostId: number
        containerId: string
        options?: {
          stdout?: boolean
          stderr?: boolean
          timestamps?: boolean
          tail?: number
          since?: string
          until?: string
        }
      }
    | {
        type: "execInContainer"
        hostId: number
        containerId: string
        command: string[]
        options?: {
          attachStdout?: boolean
          attachStderr?: boolean
          tty?: boolean
          env?: string[]
          workingDir?: string
        }
      }
    | { type: "getImages"; hostId: number }
    | { type: "pullImage"; hostId: number; imageName: string }
    | { type: "getNetworks"; hostId: number }
    | { type: "getVolumes"; hostId: number }
    | { type: "checkHostHealth"; hostId: number }
    | { type: "checkAllHostsHealth" }
    | { type: "getSystemInfo"; hostId: number }
    | { type: "getSystemVersion"; hostId: number }
    | { type: "getDiskUsage"; hostId: number }
    | { type: "pruneSystem"; hostId: number }
    | { type: "startMonitoring" }
    | { type: "stopMonitoring" }
    | { type: "isMonitoring" }
    | { type: "hasMonitoringManager" }
    | { type: "cleanup" }
    | { type: "deleteTable" }
    | { type: "createMonitoringManager" }
  )

export type WorkerResponse<T = unknown> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: string; requestId: string }

export interface WorkerMetrics {
  workerId: number
  clientId: number
  clientName: string
  hostsManaged: number
  activeStreams: number
  hasMonitoringManager: boolean
  isMonitoring: boolean
  initialized: boolean
  memoryUsage: HeapStats
  options?: DOCKER.DockerAdapterOptions
  uptime: number
}

export interface PoolMetrics {
  totalWorkers: number
  activeWorkers: number
  totalHosts: number
  totalClients: number
  averageHostsPerWorker: number
  workers: WorkerMetrics[]
}

export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
