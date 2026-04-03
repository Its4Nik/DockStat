// ============================================================================
// Container Types
// ============================================================================

/**
 * Container summary information
 */
export interface ContainerSummary {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: Port[];
  SizeRw?: number;
  SizeRootFs?: number;
  Labels?: Record<string, string>;
  State: string;
  Status: string;
  HostConfig?: {
    NetworkMode: string;
    Annotations?: Record<string, string>;
  };
  NetworkSettings?: {
    Networks?: Record<string, NetworkSummary>;
  };
  Mounts?: Mount[];
  Health?: Health;
}

/**
 * Detailed container information
 */
export interface ContainerInspectResponse {
  Id: string;
  Created: string;
  Path: string;
  Args: string[];
  State: ContainerState;
  Image: string;
  ResolvConfPath: string;
  HostnamePath: string;
  HostsPath: string;
  LogPath: string;
  Name: string;
  RestartCount: number;
  Driver: string;
  Platform: string;
  MountLabel: string;
  ProcessLabel: string;
  AppArmorProfile: string;
  ExecIDs: string[];
  HostConfig: HostConfig;
  GraphDriver: GraphDriver;
  SizeRw?: number;
  SizeRootFs?: number;
  Mounts?: Mount[];
  Config: ContainerConfig;
  NetworkSettings: NetworkSettings;
}

/**
 * Container state information
 */
export interface ContainerState {
  Status: string;
  Running: boolean;
  Paused: boolean;
  Restarting: boolean;
  OOMKilled: boolean;
  Dead: boolean;
  Pid?: number;
  ExitCode?: number;
  Error?: string;
  StartedAt?: string;
  FinishedAt?: string;
  Health?: Health;
}

/**
 * Container configuration
 */
export interface ContainerConfig {
  Hostname: string;
  Domainname: string;
  User?: string;
  AttachStdin: boolean;
  AttachStdout: boolean;
  AttachStderr: boolean;
  ExposedPorts?: Record<string, object>;
  Tty: boolean;
  OpenStdin: boolean;
  StdinOnce: boolean;
  Env?: string[];
  Cmd?: string[];
  Healthcheck?: HealthConfig;
  ArgsEscaped: boolean;
  Image: string;
  Volumes?: Record<string, object>;
  WorkingDir: string;
  Entrypoint?: string[];
  NetworkDisabled?: boolean;
  MacAddress?: string;
  OnBuild?: string[];
  Labels?: Record<string, string>;
  StopSignal?: string;
  StopTimeout?: number;
  Shell?: string[];
}

/**
 * Host configuration
 */
export interface HostConfig {
  Binds?: string[];
  ContainerIDFile?: string;
  LogConfig?: LogConfig;
  NetworkMode?: string;
  PortBindings?: Record<string, PortBinding[]>;
  RestartPolicy?: RestartPolicy;
  AutoRemove?: boolean;
  VolumeDriver?: string;
  VolumesFrom?: string[];
  CapAdd?: string[];
  CapDrop?: string[];
  CgroupnsMode?: string;
  Dns?: string[];
  DnsOptions?: string[];
  DnsSearch?: string[];
  ExtraHosts?: string[];
  GroupAdd?: string[];
  IpcMode?: string;
  Cgroup?: string;
  Links?: string[];
  OomScoreAdj?: number;
  PidMode?: string;
  Privileged?: boolean;
  PublishAllPorts?: boolean;
  ReadonlyRootfs?: boolean;
  SecurityOpt?: string[];
  StorageOpt?: Record<string, string>;
  Tmpfs?: Record<string, string>;
  UTSMode?: string;
  UsernsMode?: string;
  ShmSize?: number;
  Sysctls?: Record<string, string>;
  Runtime?: string;
  ConsoleSize?: number[];
  Isolation?: string;
  Resources?: Resources;
  MaskedPaths?: string[];
  ReadonlyPaths?: string[];
}

/**
 * Container stats
 */
export interface ContainerStatsResponse {
  id?: string;
  name?: string;
  os_type?: string;
  read: string;
  cpu_stats: ContainerCPUStats;
  memory_stats: ContainerMemoryStats;
  networks?: Record<string, ContainerNetworkStats>;
  pids_stats?: ContainerPidsStats;
  blkio_stats: ContainerBlkioStats;
  num_procs?: number;
  storage_stats?: ContainerStorageStats;
}

/**
 * CPU stats
 */
export interface ContainerCPUStats {
  cpu_usage: ContainerCPUUsage;
  system_cpu_usage: number;
  online_cpus?: number;
  throttling_data?: ContainerThrottlingData;
}

/**
 * CPU usage
 */
export interface ContainerCPUUsage {
  total_usage: number;
  percpu_usage?: number[];
  usage_in_kernelmode: number;
  usage_in_usermode: number;
}

/**
 * Throttling data
 */
export interface ContainerThrottlingData {
  periods: number;
  throttled_periods: number;
  throttled_time: number;
}

/**
 * Memory stats
 */
export interface ContainerMemoryStats {
  usage: number;
  max_usage?: number;
  stats?: Record<string, number>;
  failcnt?: number;
  limit: number;
  commitbytes?: number;
  commitpeakbytes?: number;
  privateworkingset?: number;
}

/**
 * PIDs stats
 */
export interface ContainerPidsStats {
  current?: number;
  limit?: number;
}

/**
 * Block I/O stats
 */
export interface ContainerBlkioStats {
  io_service_bytes_recursive?: ContainerBlkioStatEntry[];
  io_serviced_recursive?: ContainerBlkioStatEntry[];
  io_queue_recursive?: ContainerBlkioStatEntry[];
  io_service_time_recursive?: ContainerBlkioStatEntry[];
  io_wait_time_recursive?: ContainerBlkioStatEntry[];
  io_merged_recursive?: ContainerBlkioStatEntry[];
  io_time_recursive?: ContainerBlkioStatEntry[];
  sectors_recursive?: ContainerBlkioStatEntry[];
}

/**
 * Block I/O stat entry
 */
export interface ContainerBlkioStatEntry {
  major: number;
  minor: number;
  op: string;
  value: number;
}

/**
 * Network stats
 */
export interface ContainerNetworkStats {
  rx_bytes: number;
  rx_packets: number;
  rx_errors: number;
  rx_dropped: number;
  tx_bytes: number;
  tx_packets: number;
  tx_errors: number;
  tx_dropped: number;
}

/**
 * Storage stats
 */
export interface ContainerStorageStats {
  read_count_normalized?: number;
  read_size_bytes?: number;
  write_count_normalized?: number;
  write_size_bytes?: number;
}

/**
 * Top processes
 */
export interface ContainerTopResponse {
  Titles: string[];
  Processes: string[][];
}

/**
 * Wait response
 */
export interface ContainerWaitResponse {
  StatusCode: number;
  Error?: ContainerWaitExitError;
}

/**
 * Wait exit error
 */
export interface ContainerWaitExitError {
  Message: string;
}

/**
 * Create container response
 */
export interface ContainerCreateResponse {
  Id: string;
  Warnings?: string[];
}

/**
 * Update container response
 */
export interface ContainerUpdateResponse {
  Warnings?: string[];
}

/**
 * Container prune response
 */
export interface ContainerPruneResponse {
  ContainersDeleted?: string[];
  SpaceReclaimed: number;
}

/**
 * Health status
 */
export interface Health {
  Status: string;
  FailingStreak?: number;
  Log?: HealthcheckResult[];
}

/**
 * Health check configuration
 */
export interface HealthConfig {
  Test?: string[];
  Interval?: number;
  Timeout?: number;
  Retries?: number;
  StartPeriod?: number;
  StartInterval?: number;
}

/**
 * Health check result
 */
export interface HealthcheckResult {
  Start: string;
  End: string;
  ExitCode: number;
  Output: string;
}

/**
 * Port
 */
export interface Port {
  IP: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

/**
 * Port binding
 */
export interface PortBinding {
  HostIp: string;
  HostPort: string;
}

/**
 * Restart policy
 */
export interface RestartPolicy {
  Name: string;
  MaximumRetryCount?: number;
}

/**
 * Resources
 */
export interface Resources {
  CpuShares?: number;
  Memory?: number;
  NanoCpus?: number;
  CpuPeriod?: number;
  CpuQuota?: number;
  CpuRealtimePeriod?: number;
  CpuRealtimeRuntime?: number;
  CpusetCpus?: string;
  CpusetMems?: string;
  BlkioWeight?: number;
  BlkioWeightDevice?: { Path: string; Weight: number }[];
  BlkioDeviceReadBps?: { Path: string; Rate: number }[];
  BlkioDeviceWriteBps?: { Path: string; Rate: number }[];
  BlkioDeviceReadIOps?: { Path: string; Rate: number }[];
  BlkioDeviceWriteIOps?: { Path: string; Rate: number }[];
  MemoryReservation?: number;
  MemorySwap?: number;
  MemorySwappiness?: number;
  OomKillDisable?: boolean;
  PidsLimit?: number;
  Ulimits?: { Name: string; Soft: number; Hard: number }[];
}

/**
 * Graph driver
 */
export interface GraphDriver {
  Name: string;
  Data: Record<string, string>;
}

/**
 * Mount
 */
export interface Mount {
  Type: string;
  Name?: string;
  Source?: string;
  Destination: string;
  Driver?: string;
  Mode?: string;
  RW?: boolean;
  Propagation?: string;
}

/**
 * Log config
 */
export interface LogConfig {
  Type: string;
  Config?: Record<string, string>;
}

/**
 * Network settings
 */
export interface NetworkSettings {
  SandboxID: string;
  SandboxKey: string;
  Ports?: Record<string, PortBinding[]>;
  Networks?: Record<string, NetworkSummary>;
}

/**
 * Network summary
 */
export interface NetworkSummary {
  EndpointID?: string;
  Gateway?: string;
  IPAddress?: string;
  IPPrefixLen?: number;
  IPv6Gateway?: string;
  GlobalIPv6Address?: string;
  GlobalIPv6PrefixLen?: number;
  MacAddress?: string;
  NetworkID?: string;
}

/**
 * Filesystem change
 */
export interface FilesystemChange {
  Path: string;
  Kind: number;
}

/**
 * Exec create options
 */
export interface ExecCreateOptions {
  AttachStdin?: boolean;
  AttachStdout?: boolean;
  AttachStderr?: boolean;
  DetachKeys?: string;
  Tty?: boolean;
  Env?: string[];
  Cmd?: string[];
  Privileged?: boolean;
  User?: string;
  WorkingDir?: string;
}

/**
 * Exec create response
 */
export interface ExecCreateResponse {
  Id: string;
}

/**
 * Exec start options
 */
export interface ExecStartOptions {
  Detach?: boolean;
  Tty?: boolean;
  ConsoleSize?: number[];
}

/**
 * Exec inspect response
 */
export interface ExecInspectResponse {
  CanRemove: boolean;
  DetachKeys: string;
  ID: string;
  Running: boolean;
  ExitCode: number;
  ProcessConfig: {
    arguments: string[];
    entrypoint: string;
    privileged: boolean;
    tty: boolean;
    user: string;
  };
  OpenStdin: boolean;
  OpenStderr: boolean;
  OpenStdout: boolean;
  ContainerID: string;
  Pid: number;
}

/**
 * Archive info
 */
export interface ArchiveInfo {
  name: string;
  size: number;
  mode: number;
  mtime: string;
  linkTarget?: string;
}

/**
 * Network config
 */
export interface NetworkingConfig {
  EndpointsConfig?: Record<string, EndpointSettings>;
}

/**
 * Endpoint settings
 */
export interface EndpointSettings {
  IPAMConfig?: {
    IPv4Address?: string;
    IPv6Address?: string;
    LinkLocalIPs?: string[];
  };
  Links?: string[];
  Aliases?: string[];
  NetworkID?: string;
  EndpointID?: string;
  Gateway?: string;
  IPAddress?: string;
  IPPrefixLen?: number;
  IPv6Gateway?: string;
  GlobalIPv6Address?: string;
  GlobalIPv6PrefixLen?: number;
  MacAddress?: string;
  DriverOpts?: Record<string, string>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * List containers options
 */
export interface ListContainersOptions {
  all?: boolean;
  limit?: number;
  size?: boolean;
  filters?: {
    ancestor?: string[];
    before?: string[];
    expose?: string[];
    exited?: number[];
    health?: string[];
    id?: string[];
    isolation?: string[];
    label?: string[];
    name?: string[];
    network?: string[];
    publish?: string[];
    since?: string[];
    status?: string[];
    volume?: string[];
  };
}

/**
 * Create container options
 */
export interface CreateContainerOptions {
  name?: string;
  platform?: string;
  HostConfig?: HostConfig;
  NetworkingConfig?: NetworkingConfig;
}

/**
 * Update container options
 */
export interface UpdateContainerOptions {
  BlkioWeight?: number;
  CpuShares?: number;
  CpuPeriod?: number;
  CpuQuota?: number;
  CpuRealtimePeriod?: number;
  CpuRealtimeRuntime?: number;
  CpusetCpus?: string;
  CpusetMems?: string;
  Memory?: number;
  MemorySwap?: number;
  MemoryReservation?: number;
  RestartPolicy?: RestartPolicy;
}

/**
 * Attach options
 */
export interface AttachOptions {
  detachKeys?: string;
  log?: boolean;
  stream?: boolean;
  stdin?: boolean;
  stdout?: boolean;
  stderr?: boolean;
}

/**
 * Logs options
 */
export interface LogsOptions {
  follow?: boolean;
  stdout?: boolean;
  stderr?: boolean;
  since?: number;
  until?: number;
  timestamps?: boolean;
  tail?: string;
}

/**
 * Wait condition
 */
export type WaitCondition = 'not-running' | 'next-exit' | 'removed';

/**
 * Prune containers options
 */
export interface PruneContainersOptions {
  filters?: {
    label?: string[];
    until?: string;
  };
}

/**
 * Stats options
 */
export interface StatsOptions {
  stream?: boolean;
  'one-shot'?: boolean;
}

/**
 * Change type
 */
export enum ChangeType {
  Modified = 0,
  Added = 1,
  Deleted = 2
}
