/**
 * @dockstat/docker-swarm - Type Definitions
 *
 * Comprehensive TypeScript types for Docker Swarm operations.
 * These types are designed to be strict with no `any` usage.
 */

import type { Logger } from "@dockstat/logger"

// ============================================
// Common Types
// ============================================

/** Docker ID format (64 character hex string) */
export type DockerID = string

/** Duration string format (e.g., "10s", "5m", "1h") */
export type DurationString = string

/** Port configuration */
export interface PortConfig {
  /** The port inside the container */
  target: number
  /** The port on the swarm hosts */
  published?: number | string
  /** The protocol (tcp/udp/sctp) */
  protocol?: "tcp" | "udp" | "sctp"
  /** The mode in which port is published ("ingress" | "host") */
  mode?: "ingress" | "host"
}

/** Mount configuration */
export interface MountConfig {
  /** Mount type */
  type: "bind" | "volume" | "tmpfs" | "npipe"
  /** Source path */
  source?: string
  /** Target path inside container */
  target: string
  /** Whether mount is read-only */
  readOnly?: boolean
  /** Consistency requirement */
  consistency?: "default" | "consistent" | "cached" | "delegated"
  /** Bind mount options */
  bindOptions?: {
    propagation?: "private" | "rprivate" | "shared" | "rshared" | "slave" | "rslave"
  }
  /** Volume options */
  volumeOptions?: {
    noCopy?: boolean
    labels?: Record<string, string>
    driverConfig?: {
      name?: string
      options?: Record<string, string>
    }
  }
  /** Tmpfs options */
  tmpfsOptions?: {
    sizeBytes?: number
    mode?: number
  }
}

/** Resource limits */
export interface Resources {
  /** CPU limit (nano CPUs) */
  limits?: {
    nanoCPUs?: number
    memoryBytes?: number
    pids?: number
  }
  /** CPU reservation */
  reservations?: {
    nanoCPUs?: number
    memoryBytes?: number
    genericResources?: Array<{
      namedResourceSpec?: { kind: string; value: string }
      discreteResourceSpec?: { kind: string; value: number }
    }>
  }
}

/** Restart policy */
export interface RestartPolicy {
  /** Condition for restart */
  condition?: "none" | "on-failure" | "any"
  /** Delay between restarts */
  delay?: number
  /** Maximum attempts */
  maxAttempts?: number
  /** Window for evaluating max attempts */
  window?: number
}

/** Health check configuration */
export interface HealthConfig {
  /** Test command */
  test?: string[]
  /** Time between checks (nanoseconds) */
  interval?: number
  /** Time to wait for response (nanoseconds) */
  timeout?: number
  /** Number of consecutive failures */
  retries?: number
  /** Start period (nanoseconds) */
  startPeriod?: number
}

/** Logging configuration */
export interface LogConfig {
  /** Logging driver */
  driver?: string
  /** Driver options */
  options?: Record<string, string>
}

/** Network attachment config */
export interface NetworkAttachmentConfig {
  /** Target network */
  target: string
  /** Network aliases */
  aliases?: string[]
  /** Driver opts */
  driverOpts?: Record<string, string>
}

/** Placement constraints */
export interface Placement {
  /** Placement constraints */
  constraints?: string[]
  /** Placement preferences */
  preferences?: Array<{
    spread: { spreadDescriptor: string }
  }>
  /** Maximum replicas per node */
  maxReplicas?: number
}

/** DNS configuration */
export interface DNSConfig {
  /** DNS servers */
  nameservers?: string[]
  /** DNS search domains */
  search?: string[]
  /** DNS options */
  options?: string[]
}

/** Credential spec for Windows */
export interface CredentialSpec {
  config?: string
  file?: string
  registry?: string
}

// ============================================
// Swarm Types
// ============================================

/** Swarm cluster status */
export interface SwarmStatus {
  /** Unique identifier for the swarm */
  id?: DockerID
  /** Cluster info version */
  version?: {
    index: number
  }
  /** Timestamp when swarm was created */
  createdAt?: string
  /** Timestamp when swarm was last updated */
  updatedAt?: string
  /** Swarm specifications */
  spec?: SwarmSpec
  /** Join tokens */
  joinTokens?: {
    worker?: string
    manager?: string
  }
  /** Node ID of this node in the swarm */
  nodeID?: string
  /** Node addr of this node */
  nodeAddr?: string
  /** Whether this node is a manager */
  isManager?: boolean
}

/** Swarm specification */
export interface SwarmSpec {
  /** Swarm name */
  name?: string
  /** Labels for the swarm */
  labels?: Record<string, string>
  /** Orchestration configuration */
  orchestration?: {
    taskHistoryRetentionLimit?: number
  }
  /** Raft configuration */
  raft?: {
    snapshotInterval?: number
    keepOldSnapshots?: number
    logEntriesForSlowFollowers?: number
    electionTick?: number
    heartbeatTick?: number
  }
  /** Dispatcher configuration */
  dispatcher?: {
    heartbeatPeriod?: number
  }
  /** CA configuration */
  caConfig?: {
    nodeCertExpiry?: number
    externalCAs?: Array<{
      protocol?: string
      url: string
      options?: Record<string, string>
      caCert?: string
    }>
  }
  /** Task defaults */
  taskDefaults?: {
    logDriver?: LogConfig
  }
  /** Encryption configuration */
  encryptionConfig?: {
    autoLockManagers?: boolean
  }
}

/** Options for initializing a swarm */
export interface SwarmInitOptions {
  /** Advertise address for reachability */
  advertiseAddr?: string
  /** Listen address */
  listenAddr?: string
  /** Force create a new cluster */
  forceNewCluster?: boolean
  /** Swarm specification */
  spec?: Partial<SwarmSpec>
  /** Auto-accept policy for new nodes */
  autoAcceptManagers?: boolean
  /** Auto-accept workers */
  autoAcceptWorkers?: boolean
}

/** Options for joining a swarm */
export interface SwarmJoinOptions {
  /** Join token (worker or manager) */
  joinToken: string
  /** Addresses of remote managers */
  remoteAddrs: string[]
  /** Listen address */
  listenAddr?: string
  /** Advertise address */
  advertiseAddr?: string
}

/** Options for leaving a swarm */
export interface SwarmLeaveOptions {
  /** Force leave even if this is a manager */
  force?: boolean
}

/** Swarm update options */
export interface SwarmUpdateOptions {
  /** Swarm specification */
  spec: Partial<SwarmSpec>
  /** Version for optimistic concurrency */
  version: number
  /** Rotate manager join token */
  rotateManagerToken?: boolean
  /** Rotate worker join token */
  rotateWorkerToken?: boolean
}

// ============================================
// Node Types
// ============================================

/** Node status */
export type NodeAvailability = "active" | "pause" | "drain"
export type NodeRole = "worker" | "manager"
export type NodeState = "unknown" | "down" | "ready" | "disconnected"

/** Node information */
export interface NodeInfo {
  /** Unique node ID */
  id: DockerID
  /** Node version */
  version: {
    index: number
  }
  /** Timestamp when node was created */
  createdAt: string
  /** Timestamp when node was last updated */
  updatedAt: string
  /** Node specification */
  spec: {
    name?: string
    labels?: Record<string, string>
    role?: NodeRole
    availability?: NodeAvailability
  }
  /** Node description */
  description?: {
    hostname?: string
    platform?: {
      architecture?: string
      os?: string
    }
    resources?: {
      nanoCPUs?: number
      memoryBytes?: number
      genericResources?: Array<{
        namedResourceSpec?: { kind: string; value: string }
        discreteResourceSpec?: { kind: string; value: number }
      }>
    }
    engine?: {
      engineVersion?: string
      labels?: Record<string, string>
      plugins?: Array<{
        type: string
        name: string
      }>
    }
    tlsInfo?: {
      trustRoot?: string
      certIssuerSubject?: string
      certIssuerPublicKey?: string
    }
  }
  /** Node status */
  status: {
    state: NodeState
    message?: string
    addr?: string
  }
  /** Manager status (only for managers) */
  managerStatus?: {
    leader?: boolean
    reachability?: "unknown" | "unreachable" | "reachable"
    addr?: string
  }
}

/** Options for updating a node */
export interface NodeUpdateOptions {
  /** Node name */
  name?: string
  /** Node labels */
  labels?: Record<string, string>
  /** Node role */
  role?: NodeRole
  /** Node availability */
  availability?: NodeAvailability
}

/** Node list filters */
export interface NodeListFilters {
  /** Filter by ID */
  id?: string | string[]
  /** Filter by name */
  name?: string | string[]
  /** Filter by role */
  role?: NodeRole | NodeRole[]
  /** Filter by membership */
  membership?: "accepted" | "pending"
}

// ============================================
// Service Types
// ============================================

/** Service mode */
export type ServiceMode = "replicated" | "global" | "replicated-job" | "global-job"

/** Service endpoint spec */
export interface EndpointSpec {
  /** Endpoint mode */
  mode?: "vip" | "dnsrr"
  /** Port configurations */
  ports?: PortConfig[]
}

/** Service update config */
export interface UpdateConfig {
  /** Parallelism for updates */
  parallelism?: number
  /** Delay between updates */
  delay?: number
  /** Failure action */
  failureAction?: "continue" | "pause" | "rollback"
  /** Monitor duration */
  monitor?: number
  /** Maximum failure ratio */
  maxFailureRatio?: number
  /** Order of operations */
  order?: "stop-first" | "start-first"
}

/** Rollback config (same as update config) */
export type RollbackConfig = UpdateConfig

/** Task template */
export interface TaskSpec {
  /** Container spec */
  containerSpec?: {
    /** Image */
    image?: string
    /** Command */
    command?: string[]
    /** Arguments */
    args?: string[]
    /** Environment variables */
    env?: string[]
    /** Labels */
    labels?: Record<string, string>
    /** Hostname */
    hostname?: string
    /** Hosts entries */
    hosts?: Array<{
      ip: string
      hostnames: string[]
    }>
    /** User */
    user?: string
    /** Working directory */
    dir?: string
    /** Mounts */
    mounts?: MountConfig[]
    /** Stop grace period */
    stopGracePeriod?: number
    /** DNS config */
    dnsConfig?: DNSConfig
    /** Health check */
    healthCheck?: HealthConfig
    /** Hostname path */
    etcHostsPath?: string
    /** Secrets */
    secrets?: Array<{
      file?: { name?: string; uid?: string; gid?: string; mode?: number }
      secretId: string
      secretName: string
    }>
    /** Configs */
    configs?: Array<{
      file?: { name?: string; uid?: string; gid?: string; mode?: number }
      configId: string
      configName: string
    }>
    /** Isolation */
    isolation?: "default" | "process" | "hyperv"
    /** Init */
    init?: boolean
    /** Stop signal */
    stopSignal?: string
    /** TTY */
    tty?: boolean
    /** Open stdin */
    openStdin?: boolean
    /** Read only root filesystem */
    readOnly?: boolean
    /** Capabilities */
    capabilityAdd?: string[]
    capabilityDrop?: string[]
  }
  /** Resources */
  resources?: Resources
  /** Restart policy */
  restartPolicy?: RestartPolicy
  /** Placement */
  placement?: Placement
  /** Log driver */
  logDriver?: LogConfig
  /** Networks */
  networks?: NetworkAttachmentConfig[]
}

/** Service information */
export interface ServiceInfo {
  /** Service ID */
  id: DockerID
  /** Service version */
  version: {
    index: number
  }
  /** Timestamp when service was created */
  createdAt: string
  /** Timestamp when service was last updated */
  updatedAt: string
  /** Service specification */
  spec: {
    name: string
    labels?: Record<string, string>
    mode?: {
      replicated?: { replicas: number }
      global?: Record<string, never>
      replicatedJob?: {
        maxConcurrent?: number
        totalCompletions?: number
      }
      globalJob?: Record<string, never>
    }
    taskTemplate: TaskSpec
    updateConfig?: UpdateConfig
    rollbackConfig?: RollbackConfig
    endpointSpec?: EndpointSpec
  }
  /** Previous spec (for rollback) */
  previousSpec?: ServiceInfo["spec"]
  /** Service endpoint */
  endpoint?: {
    spec?: EndpointSpec
    ports?: Array<{
      protocol?: string
      targetPort?: number
      publishedPort?: number
      publishMode?: string
    }>
    virtualIPs?: Array<{
      networkId: DockerID
      addr: string
    }>
  }
  /** Service update status */
  updateStatus?: {
    state?:
      | "updating"
      | "paused"
      | "completed"
      | "rollback_started"
      | "rollback_paused"
      | "rollback_completed"
    startedAt?: string
    completedAt?: string
    message?: string
  }
  /** Job status (for job services) */
  jobStatus?: {
    jobIteration?: { index: number }
    executionState?: string
    lastExecution?: string
  }
}

/** Options for creating a service */
export interface ServiceCreateOptions {
  /** Service name */
  name: string
  /** Container image */
  image: string
  /** Number of replicas (for replicated mode) */
  replicas?: number
  /** Service mode */
  mode?: ServiceMode
  /** Environment variables */
  env?: string[] | Record<string, string>
  /** Service labels */
  labels?: Record<string, string>
  /** Container labels */
  containerLabels?: Record<string, string>
  /** Networks to attach */
  networks?: string[]
  /** Port mappings */
  ports?: PortConfig[]
  /** Mounts */
  mounts?: MountConfig[]
  /** Resources */
  resources?: Resources
  /** Restart policy */
  restartPolicy?: RestartPolicy
  /** Update config */
  updateConfig?: UpdateConfig
  /** Rollback config */
  rollbackConfig?: RollbackConfig
  /** Health check */
  healthCheck?: HealthConfig
  /** Placement constraints */
  constraints?: string[]
  /** Placement preferences */
  preferences?: Array<{ spread: string }>
  /** Command */
  command?: string[]
  /** Arguments */
  args?: string[]
  /** User */
  user?: string
  /** Working directory */
  workdir?: string
  /** Hostname */
  hostname?: string
  /** Stop grace period (seconds) */
  stopGracePeriod?: number
  /** Secrets */
  secrets?: Array<{ secretId: string; secretName: string; target?: string }>
  /** Configs */
  configs?: Array<{ configId: string; configName: string; target?: string }>
  /** DNS config */
  dnsConfig?: DNSConfig
  /** Log driver */
  logDriver?: string
  /** Log options */
  logOptions?: Record<string, string>
  /** Endpoint mode */
  endpointMode?: "vip" | "dnsrr"
  /** Host entries */
  hosts?: Array<{ ip: string; hostnames: string[] }>
  /** Max replicas per node */
  maxReplicas?: number
  /** Isolation mode */
  isolation?: "default" | "process" | "hyperv"
  /** Init */
  init?: boolean
  /** Read only root filesystem */
  readOnly?: boolean
  /** Stop signal */
  stopSignal?: string
  /** TTY */
  tty?: boolean
  /** Open stdin */
  openStdin?: boolean
  /** Capabilities to add */
  capAdd?: string[]
  /** Capabilities to drop */
  capDrop?: string[]
}

/** Options for updating a service */
export interface ServiceUpdateOptions {
  /** Version for optimistic concurrency */
  version: number
  /** Container image */
  image?: string
  /** Number of replicas */
  replicas?: number
  /** Environment variables */
  env?: string[] | Record<string, string>
  /** Service labels */
  labels?: Record<string, string>
  /** Networks to attach */
  networks?: string[]
  /** Port mappings */
  ports?: PortConfig[]
  /** Mounts */
  mounts?: MountConfig[]
  /** Resources */
  resources?: Resources
  /** Restart policy */
  restartPolicy?: RestartPolicy
  /** Update config */
  updateConfig?: UpdateConfig
  /** Rollback config */
  rollbackConfig?: RollbackConfig
  /** Health check */
  healthCheck?: HealthConfig
  /** Placement constraints */
  constraints?: string[]
  /** Registry auth */
  registryAuth?: string
  /** Force update even if spec unchanged */
  force?: boolean
}

/** Service list filters */
export interface ServiceListFilters {
  /** Filter by ID */
  id?: string | string[]
  /** Filter by name */
  name?: string | string[]
  /** Filter by label */
  label?: string | string[]
  /** Filter by mode */
  mode?: ServiceMode
}

/** Service logs options */
export interface ServiceLogsOptions {
  /** Follow log output */
  follow?: boolean
  /** Show timestamps */
  timestamps?: boolean
  /** Number of lines to tail */
  tail?: number
  /** Only show logs since this time */
  since?: number | string
  /** Only show logs before this time */
  until?: number | string
  /** Output format */
  details?: boolean
  /** Only show stdout */
  stdout?: boolean
  /** Only show stderr */
  stderr?: boolean
}

// ============================================
// Task Types
// ============================================

/** Task state */
export type TaskState =
  | "new"
  | "pending"
  | "assigned"
  | "accepted"
  | "preparing"
  | "starting"
  | "running"
  | "complete"
  | "shutdown"
  | "failed"
  | "rejected"

/** Network attachment for a task */
export interface NetworksAttachment {
  /** Network information */
  network: {
    id: DockerID
    spec: {
      name: string
      labels?: Record<string, string>
      driverConfiguration?: {
        name?: string
        options?: Record<string, string>
      }
      ipv6Enabled?: boolean
      internal?: boolean
      attachable?: boolean
      ingress?: boolean
      ipamOptions?: {
        driver?: {
          name?: string
          options?: Record<string, string>
        }
        configs?: Array<{
          subnet?: string
          range?: string
          gateway?: string
        }>
      }
    }
  }
  /** Network addresses */
  addresses: string[]
}

/** Task information */
export interface TaskInfo {
  /** Task ID */
  id: DockerID
  /** Task version */
  version: {
    index: number
  }
  /** Timestamp when task was created */
  createdAt: string
  /** Timestamp when task was last updated */
  updatedAt: string
  /** Task name */
  name?: string
  /** Task specification */
  spec: TaskSpec
  /** Service ID */
  serviceId: DockerID
  /** Slot (for replicated services) */
  slot?: number
  /** Node ID */
  nodeId?: DockerID
  /** Status */
  status: {
    timestamp: string
    state: TaskState
    message?: string
    err?: string
    containerStatus?: {
      containerId?: DockerID
      pid?: number
      exitCode?: number
    }
    portStatus?: {
      ports?: Array<{
        protocol: string
        publishedPort: number
        targetPort: number
      }>
    }
  }
  /** Desired state */
  desiredState: TaskState
  /** Networks attachments */
  networksAttachments?: NetworksAttachment[]
  /** Job iteration */
  jobIteration?: {
    index: number
  }
}

/** Task list filters */
export interface TaskListFilters {
  /** Filter by ID */
  id?: string | string[]
  /** Filter by name */
  name?: string | string[]
  /** Filter by service */
  service?: string | string[]
  /** Filter by node */
  node?: string | string[]
  /** Filter by label */
  label?: string | string[]
  /** Filter by desired state */
  desiredState?: TaskState | TaskState[]
  /** Filter by ID up to */
  idUpTo?: string
}

// ============================================
// Stack Types
// ============================================

/** Stack information */
export interface StackInfo {
  /** Stack name */
  name: string
  /** Services in the stack */
  services: ServiceInfo[]
  /** Networks used by the stack */
  networks: string[]
  /** Secrets used by the stack */
  secrets: string[]
  /** Configs used by the stack */
  configs: string[]
  /** Creation timestamp */
  createdAt?: string
  /** Last updated timestamp */
  updatedAt?: string
}

/** Options for deploying a stack */
export interface StackDeployOptions {
  /** Stack name */
  name: string
  /** Docker compose YAML content */
  compose: string
  /** Environment file content */
  envContent?: string
  /** Environment variables */
  env?: Record<string, string>
  /** Prune services no longer defined */
  prune?: boolean
  /** Resolve image digest */
  resolveImage?: "always" | "changed" | "never"
  /** Registry auth for private images */
  registryAuth?: Record<string, string>
  /** Target node for placement (constraint) */
  targetNode?: string
  /** With registry auth */
  withRegistryAuth?: boolean
}

/** Stack list result */
export interface StackListResult {
  name: string
  services: number
  networks: number
  secrets: number
  configs: number
  orchestrator: "swarm"
}

// ============================================
// Secret Types
// ============================================

/** Secret information */
export interface SecretInfo {
  /** Secret ID */
  id: DockerID
  /** Version index */
  version: {
    index: number
  }
  /** Timestamp when secret was created */
  createdAt: string
  /** Timestamp when secret was last updated */
  updatedAt: string
  /** Secret specification */
  spec: {
    name: string
    labels?: Record<string, string>
    driver?: {
      name?: string
      options?: Record<string, string>
    }
    templating?: {
      name?: string
      options?: Record<string, string>
    }
  }
}

/** Options for creating a secret */
export interface SecretCreateOptions {
  /** Secret name */
  name: string
  /** Secret data */
  data: string | Buffer | Uint8Array
  /** Labels */
  labels?: Record<string, string>
  /** Driver for encrypted secrets */
  driver?: {
    name?: string
    options?: Record<string, string>
  }
  /** Templating driver */
  templating?: {
    name?: string
    options?: Record<string, string>
  }
}

/** Options for updating a secret */
export interface SecretUpdateOptions {
  /** Secret ID */
  id: string
  /** Version for optimistic concurrency */
  version: number
  /** New name */
  name?: string
  /** New data */
  data?: string | Buffer | Uint8Array
  /** Labels */
  labels?: Record<string, string>
}

/** Secret list filters */
export interface SecretListFilters {
  /** Filter by ID */
  id?: string | string[]
  /** Filter by name */
  name?: string | string[]
  /** Filter by label */
  label?: string | string[]
  /** Filter by mode */
  mode?: "any" | "ingress"
}

// ============================================
// Config Types
// ============================================

/** Config information */
export interface ConfigInfo {
  /** Config ID */
  id: DockerID
  /** Version index */
  version: {
    index: number
  }
  /** Timestamp when config was created */
  createdAt: string
  /** Timestamp when config was last updated */
  updatedAt: string
  /** Config specification */
  spec: {
    name: string
    labels?: Record<string, string>
    templating?: {
      name?: string
      options?: Record<string, string>
    }
  }
}

/** Options for creating a config */
export interface ConfigCreateOptions {
  /** Config name */
  name: string
  /** Config data */
  data: string | Buffer | Uint8Array
  /** Labels */
  labels?: Record<string, string>
  /** Templating driver */
  templating?: {
    name?: string
    options?: Record<string, string>
  }
}

/** Options for updating a config */
export interface ConfigUpdateOptions {
  /** Config ID */
  id: string
  /** Version for optimistic concurrency */
  version: number
  /** New name */
  name?: string
  /** New data */
  data?: string | Buffer | Uint8Array
  /** Labels */
  labels?: Record<string, string>
}

/** Config list filters */
export interface ConfigListFilters {
  /** Filter by ID */
  id?: string | string[]
  /** Filter by name */
  name?: string | string[]
  /** Filter by label */
  label?: string | string[]
}

// ============================================
// Network Types (Swarm-specific)
// ============================================

/** Network type for swarm */
export type NetworkDriver = "bridge" | "overlay" | "macvlan" | "host" | "none" | "ipvlan"

/** Swarm network information */
export interface SwarmNetworkInfo {
  /** Network name */
  name: string
  /** Network ID */
  id: DockerID
  /** Timestamp when network was created */
  created: string
  /** Network scope */
  scope: "local" | "swarm"
  /** Network driver */
  driver: NetworkDriver
  /** Whether network is attachable */
  attachable?: boolean
  /** Whether network is ingress */
  ingress?: boolean
  /** Whether network is internal only */
  internal?: boolean
  /** Enable IPv6 */
  enableIPv6?: boolean
  /** IPAM configuration */
  ipam?: {
    driver?: string
    config?: Array<{
      subnet?: string
      ipRange?: string
      gateway?: string
      auxiliaryAddresses?: Record<string, string>
    }>
    options?: Record<string, string>
  }
  /** Network labels */
  labels?: Record<string, string>
  /** Network options */
  options?: Record<string, string>
}

/** Options for creating a swarm network */
export interface SwarmNetworkCreateOptions {
  /** Network name */
  name: string
  /** Network driver */
  driver?: NetworkDriver
  /** Whether network is attachable */
  attachable?: boolean
  /** Whether network is ingress */
  ingress?: boolean
  /** Whether network is internal only */
  internal?: boolean
  /** Enable IPv6 */
  enableIPv6?: boolean
  /** IPAM configuration */
  ipam?: {
    driver?: string
    config?: Array<{
      subnet?: string
      ipRange?: string
      gateway?: string
    }>
    options?: Record<string, string>
  }
  /** Network labels */
  labels?: Record<string, string>
  /** Network options */
  options?: Record<string, string>
  /** Check duplicate */
  checkDuplicate?: boolean
}

// ============================================
// Event Types
// ============================================

/** Swarm event type */
export interface SwarmEvent {
  /** Event type */
  type: "node" | "service" | "task" | "secret" | "config" | "network"
  /** Event action */
  action: "create" | "update" | "remove"
  /** Actor that triggered the event */
  actor: {
    id: string
    attributes?: Record<string, string>
  }
  /** Event timestamp */
  time: number
  /** Event time nano */
  timeNano?: number
}

// ============================================
// Client Types
// ============================================

/** Docker connection options */
export interface DockerConnectionOptions {
  /** Docker socket path */
  socketPath?: string
  /** Remote host URL */
  host?: string
  /** Connection timeout */
  timeout?: number
  /** TLS options */
  tls?: {
    ca?: string | Buffer
    cert?: string | Buffer
    key?: string | Buffer
  }
  /** SSH options */
  ssh?: {
    host: string
    port?: number
    username?: string
    privateKey?: string | Buffer
    passphrase?: string
  }
}

/** Swarm client options */
export interface SwarmClientOptions extends DockerConnectionOptions {
  /** Logger instance from @dockstat/logger */
  logger?: Logger
  /** Enable debug mode */
  debug?: boolean
}

// ============================================
// Result Types
// ============================================

/** Command result */
export interface CommandResult<T> {
  /** Whether operation succeeded */
  success: boolean
  /** Result data */
  data?: T
  /** Standard output */
  stdout?: string
  /** Standard error */
  stderr?: string
  /** Error message */
  error?: string
  /** Error code */
  errorCode?: SwarmErrorCode
}

/** Operation result */
export interface OperationResult {
  /** Whether operation succeeded */
  success: boolean
  /** Message */
  message?: string
  /** Error */
  error?: string
}

// ============================================
// Error Types
// ============================================

/** Swarm error codes */
export enum SwarmErrorCode {
  // General errors
  UNKNOWN = "UNKNOWN",
  NOT_CONNECTED = "NOT_CONNECTED",
  CONNECTION_FAILED = "CONNECTION_FAILED",
  TIMEOUT = "TIMEOUT",
  PERMISSION_DENIED = "PERMISSION_DENIED",

  // Swarm errors
  NOT_IN_SWARM = "NOT_IN_SWARM",
  NOT_A_SWARM_MANAGER = "NOT_A_SWARM_MANAGER",
  ALREADY_IN_SWARM = "ALREADY_IN_SWARM",
  SWARM_UNREACHABLE = "SWARM_UNREACHABLE",
  INVALID_JOIN_TOKEN = "INVALID_JOIN_TOKEN",

  // Service errors
  SERVICE_NOT_FOUND = "SERVICE_NOT_FOUND",
  SERVICE_NAME_CONFLICT = "SERVICE_NAME_CONFLICT",
  SERVICE_UPDATE_FAILED = "SERVICE_UPDATE_FAILED",
  SERVICE_SCALE_FAILED = "SERVICE_SCALE_FAILED",

  // Node errors
  NODE_NOT_FOUND = "NODE_NOT_FOUND",
  NODE_UPDATE_FAILED = "NODE_UPDATE_FAILED",
  NODE_REMOVE_FAILED = "NODE_REMOVE_FAILED",

  // Task errors
  TASK_NOT_FOUND = "TASK_NOT_FOUND",

  // Stack errors
  STACK_NOT_FOUND = "STACK_NOT_FOUND",
  STACK_DEPLOY_FAILED = "STACK_DEPLOY_FAILED",
  STACK_REMOVE_FAILED = "STACK_REMOVE_FAILED",
  INVALID_COMPOSE = "INVALID_COMPOSE",

  // Secret errors
  SECRET_NOT_FOUND = "SECRET_NOT_FOUND",
  SECRET_NAME_CONFLICT = "SECRET_NAME_CONFLICT",

  // Config errors
  CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
  CONFIG_NAME_CONFLICT = "CONFIG_NAME_CONFLICT",

  // Network errors
  NETWORK_NOT_FOUND = "NETWORK_NOT_FOUND",
  NETWORK_NAME_CONFLICT = "NETWORK_NAME_CONFLICT",
  NETWORK_IN_USE = "NETWORK_IN_USE",
}

/** Swarm error class */
export class SwarmError extends Error {
  constructor(
    public readonly code: SwarmErrorCode,
    message: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = "SwarmError"
  }
}
