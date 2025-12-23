import type { EVENTS } from "@dockstat/typings"
import type { DockMonTable } from "../types"

/**
 * Maps host metrics from the event hook to the database format
 */
export function mapFromHostMetricHookToDb(
  hostMetricEvent: Parameters<EVENTS["host:metrics"]>[0]
): Omit<Omit<DockMonTable, "id">, "stored_on"> {
  return {
    container_id: null,
    docker_client_id: hostMetricEvent.docker_client_id,
    host_id: hostMetricEvent.hostId,
    type: "HOST",
    data: { host_metrics: hostMetricEvent.metrics },
  }
}

/**
 * Maps container metrics from the event hook to the database format
 */
export function mapFromContainerMetricHookToDb(
  containerMetricEvent: Parameters<EVENTS["container:metrics"]>[0]
): Omit<Omit<DockMonTable, "id">, "stored_on"> {
  return {
    container_id: containerMetricEvent.containerId,
    docker_client_id: containerMetricEvent.docker_client_id,
    host_id: containerMetricEvent.hostId,
    type: "CONTAINER",
    data: { container_metrics: containerMetricEvent.stats },
  }
}

/**
 * Formats bytes to a human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
}

/**
 * Formats a timestamp to a human-readable date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

/**
 * Calculates memory usage percentage
 */
export function calculateMemoryPercent(used: number, limit: number): number {
  if (limit === 0) return 0
  return Number.parseFloat(((used / limit) * 100).toFixed(2))
}

/**
 * Formats CPU usage percentage
 */
export function formatCpuUsage(cpuPercent: number): string {
  return `${cpuPercent.toFixed(2)}%`
}

/**
 * Formats network traffic
 */
export function formatNetworkTraffic(bytes: number): string {
  return formatBytes(bytes)
}
