import type { DOCKER, DockerAdapterOptions } from "@dockstat/typings"

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
  memoryUsage?: { rss: number; heapTotal: number; heapUsed: number; external: number } | undefined
  options?: DOCKER.DockerAdapterOptions
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
  workerId: number
  clientId: number
  clientName: string
  hostsManaged: number
  activeStreams: number
  isMonitoring: boolean
  initialized: boolean
  memoryUsage?: { rss: number; heapTotal: number; heapUsed: number; external: number } | undefined
  options?: DOCKER.DockerAdapterOptions
  uptime: number
}

/**
 * Client with full configuration options
 */
export interface ClientWithConfig extends Client {
  options: DockerAdapterOptions
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
  clientsWithConfig: ClientWithConfig[]
}

/**
 * Action response types
 */
export interface ActionSuccess<T = unknown> {
  success: true
  data?: T
  message?: string
}

export interface ActionError {
  success: false
  error: string
}

export type ActionResponse<T = unknown> = ActionSuccess<T> | ActionError

/**
 * Props for StatCard component
 */
export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  variant?: "default" | "success" | "warning" | "error"
}

/**
 * Props for WorkerCard component
 */
export interface WorkerCardProps {
  worker: Worker
  hosts?: Host[]
}

/**
 * Props for WorkersList component
 */
export interface WorkersListProps {
  workers: Worker[]
  hosts?: Host[]
}

/**
 * Props for ClientsList component
 */
export interface ClientsListProps {
  clients: Client[]
  workers: Worker[]
  hosts?: Host[]
}

/**
 * Props for HostsList component
 */
export interface HostsListProps {
  hosts: Host[]
  clients?: Client[]
  workers?: Worker[]
}

/**
 * Props for ClientDetailModal component
 */
export interface ClientDetailModalProps {
  open: boolean
  onClose: () => void
  client: Client
  worker?: Worker | null
  hosts?: Host[]
}

/**
 * Props for HostDetailModal component
 */
export interface HostDetailModalProps {
  open: boolean
  onClose: () => void
  host: Host | null
  client?: Client | null
  worker?: Worker | null
}

/**
 * Props for RegisterClientForm component
 */
export interface RegisterClientFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * Props for AddHostForm component
 */
export interface AddHostFormProps {
  clients: {
    workerId: number
    clientId: number
    clientName: string
    hostsManaged: number
    activeStreams: number
    isMonitoring: boolean
    initialized: boolean
    memoryUsage?:
      | {
          rss: number
          heapTotal: number
          heapUsed: number
          external: number
        }
      | undefined
    uptime: number
  }[]
  onClose?: () => void
}

/**
 * Props for DeleteClientButton component
 */
export interface DeleteClientButtonProps {
  clientId: number
  clientName: string
  size?: "sm" | "md" | "lg"
}

/**
 * Props for MonitoringToggle component
 */
export interface MonitoringToggleProps {
  clientId: number
  isMonitoring: boolean
}

/**
 * Props for StatusBar component
 */
export interface StatusBarProps {
  totalClients: number
  totalHosts: number
  activeWorkers: number
  totalWorkers: number
  monitoringHosts: number
  totalContainers: number
}
