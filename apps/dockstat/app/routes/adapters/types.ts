import type { DockerAdapterOptions } from "@dockstat/typings"

/**
 * Memory usage stats from a worker process
 */
export interface MemoryUsage {
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  arrayBuffers?: number
}

/**
 * Worker data returned from the backend /status endpoint
 * Each worker manages a single client
 */
export interface Worker {
  workerId: number
  clientId: number
  clientName: string
  hostsManaged: number
  activeStreams: number
  isMonitoring: boolean
  initialized: boolean
  memoryUsage: MemoryUsage
  uptime: number
}

/**
 * Host configuration
 */
export interface Host {
  id: number
  name: string
  clientId: number
  host?: string
  port?: number
  secure?: boolean
}

/**
 * Client registration data from the database
 */
export interface Client {
  id: number
  name: string
  initialized?: boolean
}

/**
 * Client with full configuration options
 */
export interface ClientWithConfig extends Client {
  options: DockerAdapterOptions
}

/**
 * Combined client data with worker status
 * This is the enriched view used by the UI
 */
export interface ClientWithStatus extends Client {
  isMonitoring: boolean
  hostsManaged: number
  activeStreams: number
  uptime: number
  workerId?: number
}

/**
 * Status response from /api/v2/docker/status
 */
export interface AdapterStatus {
  totalWorkers: number
  activeWorkers: number
  totalHosts: number
  totalClients: number
  averageHostsPerWorker: number
  workers: Worker[]
  hosts: Host[]
}

/**
 * Loader data shape for the adapters page
 */
export interface AdapterLoaderData {
  status: AdapterStatus
  clients: Client[]
  clientsWithConfig: ClientWithConfig[]
  hosts: Host[]
}

/**
 * Helper to merge client data with worker status
 */
export function mergeClientWithWorker(client: Client, workers: Worker[]): ClientWithStatus {
  const worker = workers.find((w) => w.clientId === client.id)

  return {
    ...client,
    initialized: worker?.initialized ?? client.initialized ?? false,
    isMonitoring: worker?.isMonitoring ?? false,
    hostsManaged: worker?.hostsManaged ?? 0,
    activeStreams: worker?.activeStreams ?? 0,
    uptime: worker?.uptime ?? 0,
    workerId: worker?.workerId,
  }
}

/**
 * Helper to get all clients with their worker status
 */
export function getClientsWithStatus(clients: Client[], workers: Worker[]): ClientWithStatus[] {
  return clients.map((client) => mergeClientWithWorker(client, workers))
}
