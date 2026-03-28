export type StackEnv = Record<string, string | boolean | number | undefined>

export type EnvValue = string | number | boolean | null | undefined
export type EnvMap = Record<string, EnvValue>

export interface Stack extends Record<string, unknown> {
  id: number
  name: string
  version: string
  repository: string
  stack: string
  yaml: string
  env: EnvMap
  dockNodeId: number
}

export interface CreateStackInput {
  name: string
  yaml: string
  repository: string
  repoName: string
  version: string
  env: EnvMap
  dockNodeId?: number
}

export interface UpdateStackInput {
  version?: string
  yaml?: string
  env?: EnvMap
}

export interface DeleteStackOptions {
  removeFiles?: boolean
}

// ============================================
// Docker Swarm Types
// ============================================

/** Swarm service mode */
export type SwarmServiceMode = "replicated" | "global" | "replicated-job" | "global-job"

/** Swarm service state */
export type SwarmServiceState = "running" | "paused" | "stopped" | "pending" | "failed"

/** Swarm node availability */
export type SwarmNodeAvailability = "active" | "pause" | "drain"

/** Swarm node role */
export type SwarmNodeRole = "manager" | "worker"

/** Swarm node state */
export type SwarmNodeState = "unknown" | "down" | "ready" | "disconnected"

/** Swarm service replica status */
export interface SwarmReplicaStatus {
  running: number
  desired: number
  failed: number
  pending: number
}

/** Swarm service info */
export interface SwarmServiceInfo {
  id: string
  name: string
  mode: SwarmServiceMode
  replicas: SwarmReplicaStatus
  image: string
  ports: SwarmPortMapping[]
  createdAt: string
  updatedAt: string
  labels: Record<string, string>
  stackName: string
}

/** Swarm port mapping */
export interface SwarmPortMapping {
  publishedPort: number
  targetPort: number
  protocol: "tcp" | "udp" | "sctp"
  mode: "ingress" | "host"
}

/** Swarm node info */
export interface SwarmNodeInfo {
  id: string
  name: string
  hostname: string
  role: SwarmNodeRole
  availability: SwarmNodeAvailability
  state: SwarmNodeState
  address: string
  labels: Record<string, string>
  platform: {
    os: string
    architecture: string
  }
  resources: {
    nanoCpu: number
    memoryBytes: number
  }
  managerStatus?: {
    leader: boolean
    reachability: string
    addr: string
  }
}

/** Swarm task info */
export interface SwarmTaskInfo {
  id: string
  name: string
  serviceId: string
  serviceName: string
  nodeId: string
  nodeName: string
  state: SwarmServiceState
  desiredState: SwarmServiceState
  error?: string
  createdAt: string
  updatedAt: string
}

/** Swarm network info */
export interface SwarmNetworkInfo {
  id: string
  name: string
  driver: string
  scope: "local" | "swarm"
  attachable: boolean
  ingress: boolean
  ipam: {
    driver: string
    config: Array<{
      subnet: string
      gateway?: string
    }>
  }
  labels: Record<string, string>
}

/** Swarm config info */
export interface SwarmConfigInfo {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  labels: Record<string, string>
}

/** Swarm secret info */
export interface SwarmSecretInfo {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  labels: Record<string, string>
}

/** Swarm stack info (for Docker Swarm stacks) */
export interface SwarmStackInfo {
  name: string
  services: SwarmServiceInfo[]
  networks: SwarmNetworkInfo[]
  configs: SwarmConfigInfo[]
  secrets: SwarmSecretInfo[]
}

/** Swarm status */
export interface SwarmStatus {
  isSwarmManager: boolean
  isSwarmWorker: boolean
  nodeCount: number
  managerCount: number
  swarmId?: string
  clusterName?: string
  joinTokens?: {
    manager: string
    worker: string
  }
}

/** Swarm init options */
export interface SwarmInitOptions {
  advertiseAddr?: string
  listenAddr?: string
  forceNewCluster?: boolean
  swarmDefaultAddrPool?: string[]
  subnetSize?: number
  dataPathAddr?: string
  dataPathPort?: number
}

/** Swarm join options */
export interface SwarmJoinOptions {
  remoteAddrs: string[]
  joinToken: string
  listenAddr?: string
  advertiseAddr?: string
  dataPathAddr?: string
}

/** Swarm stack deploy options */
export interface SwarmStackDeployOptions {
  name: string
  composeFile: string
  registryAuth?: boolean
  prune?: boolean
  resolveImage?: "always" | "changed" | "never"
  withRegistryAuth?: boolean
  detach?: boolean
  quiet?: boolean
}

/** Swarm stack remove options */
export interface SwarmStackRemoveOptions {
  name: string
  prune?: boolean
}

/** Swarm service scale options */
export interface SwarmServiceScaleOptions {
  serviceId: string
  replicas: number
  detach?: boolean
}

/** Swarm service update options */
export interface SwarmServiceUpdateOptions {
  serviceId: string
  image?: string
  env?: EnvMap
  replicas?: number
  constraints?: string[]
  labels?: Record<string, string>
  restartPolicy?: {
    condition: "none" | "on-failure" | "any"
    delay?: number
    maxAttempts?: number
    window?: number
  }
  resources?: {
    limits?: {
      nanoCpu?: number
      memoryBytes?: number
    }
    reservations?: {
      nanoCpu?: number
      memoryBytes?: number
    }
  }
}

/** Swarm service create options */
export interface SwarmServiceCreateOptions {
  name: string
  image: string
  replicas?: number
  env?: EnvMap
  labels?: Record<string, string>
  constraints?: string[]
  networks?: string[]
  ports?: SwarmPortMapping[]
  mounts?: Array<{
    source: string
    target: string
    readOnly?: boolean
    type: "bind" | "volume" | "tmpfs"
  }>
  resources?: SwarmServiceUpdateOptions["resources"]
  restartPolicy?: SwarmServiceUpdateOptions["restartPolicy"]
  healthCheck?: {
    test: string[]
    interval?: number
    timeout?: number
    retries?: number
    startPeriod?: number
  }
}

/** Swarm logs options */
export interface SwarmLogsOptions {
  serviceId: string
  follow?: boolean
  tail?: number
  since?: number
  timestamps?: boolean
  details?: boolean
}

/** Stream log message */
export interface StreamLogMessage {
  timestamp: string
  message: string
  serviceId?: string
  serviceName?: string
  nodeId?: string
  nodeName?: string
  level: "info" | "warn" | "error" | "debug"
}
