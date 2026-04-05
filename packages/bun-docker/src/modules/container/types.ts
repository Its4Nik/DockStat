/**
 * Container Module Types
 * This file imports type definitions from the OpenAPI specification (v1.54.d.ts)
 * and defines request/response option types specific to this API client.
 */

import type {
  ContainerConfig,
  ContainerCreateResponse,
  ContainerInspectResponse,
  ContainerPruneResponse,
  ContainerStatsResponse,
  ContainerState,
  ContainerSummary,
  ContainerTopResponse,
  ContainerUpdateResponse,
  ContainerWaitResponse,
  ContainerWaitExitError,
  EndpointSettings,
  FilesystemChange,
  GraphDriver,
  Health,
  HealthConfig,
  HealthcheckResult,
  HostConfig,
  LogConfig,
  MountPoint,
  NetworkSettings,
  NetworkingConfig,
  PortSummary,
  RestartPolicy,
  Resources,
  ContainerPathStat,
  IDResponse,
} from '../../openapi-types'

// ============================================================================
// Re-export OpenAPI Types
// ============================================================================

export type {
  ContainerConfig,
  ContainerCreateResponse,
  ContainerInspectResponse,
  ContainerPruneResponse,
  ContainerStatsResponse,
  ContainerState,
  ContainerSummary,
  ContainerTopResponse,
  ContainerUpdateResponse,
  ContainerWaitResponse,
  ContainerWaitExitError,
  EndpointSettings,
  FilesystemChange,
  GraphDriver,
  Health,
  HealthConfig,
  HealthcheckResult,
  HostConfig,
  LogConfig,
  NetworkSettings,
  NetworkingConfig,
  RestartPolicy,
  Resources,
}

// Type aliases for backward compatibility
export type Port = PortSummary
export type Mount = MountPoint
export type ArchiveInfo = ContainerPathStat
export type ExecCreateResponse = IDResponse

// PortBinding - this type is used in NetworkSettings.Ports and HostConfig.PortBindings
export interface PortBinding {
  HostIp: string
  HostPort: string
}

// ============================================================================
// Exec Request Types
// These are defined inline in the OpenAPI operations
// ============================================================================

/**
 * Exec create options
 */
export interface ExecCreateOptions {
  AttachStdin?: boolean
  AttachStdout?: boolean
  AttachStderr?: boolean
  DetachKeys?: string
  Tty?: boolean
  Env?: string[]
  Cmd?: string[]
  Privileged?: boolean
  User?: string
  WorkingDir?: string
}

/**
 * Exec start options
 */
export interface ExecStartOptions {
  Detach?: boolean
  Tty?: boolean
  ConsoleSize?: number[]
}

/**
 * Exec inspect response
 * Note: This type is not explicitly defined in OpenAPI schemas,
 * it's inferred from the ExecInspect operation
 */
export interface ExecInspectResponse {
  CanRemove: boolean
  DetachKeys: string
  ID: string
  Running: boolean
  ExitCode: number
  ProcessConfig: {
    arguments: string[]
    entrypoint: string
    privileged: boolean
    tty: boolean
    user: string
  }
  OpenStdin: boolean
  OpenStderr: boolean
  OpenStdout: boolean
  ContainerID: string
  Pid: number
}

// ============================================================================
// Request/Response Option Types
// These are specific to this API client layer
// ============================================================================

/**
 * List containers options
 */
export interface ListContainersOptions {
  all?: boolean
  limit?: number
  size?: boolean
  filters?: {
    ancestor?: string[]
    before?: string[]
    expose?: string[]
    exited?: number[]
    health?: string[]
    id?: string[]
    isolation?: string[]
    label?: string[]
    name?: string[]
    network?: string[]
    publish?: string[]
    since?: string[]
    status?: string[]
    volume?: string[]
  }
}

/**
 * Create container options
 */
export interface CreateContainerOptions {
  name?: string
  platform?: string
  HostConfig?: HostConfig
  NetworkingConfig?: NetworkingConfig
}

/**
 * Update container options
 */
export interface UpdateContainerOptions {
  BlkioWeight?: number
  CpuShares?: number
  CpuPeriod?: number
  CpuQuota?: number
  CpuRealtimePeriod?: number
  CpuRealtimeRuntime?: number
  CpusetCpus?: string
  CpusetMems?: string
  Memory?: number
  MemorySwap?: number
  MemoryReservation?: number
  RestartPolicy?: RestartPolicy
}

/**
 * Attach options
 */
export interface AttachOptions {
  detachKeys?: string
  log?: boolean
  stream?: boolean
  stdin?: boolean
  stdout?: boolean
  stderr?: boolean
}

/**
 * Logs options
 */
export interface LogsOptions {
  follow?: boolean
  stdout?: boolean
  stderr?: boolean
  since?: number
  until?: number
  timestamps?: boolean
  tail?: string
}

/**
 * Wait condition
 */
export type WaitCondition = 'not-running' | 'next-exit' | 'removed'

/**
 * Prune containers options
 */
export interface PruneContainersOptions {
  filters?: {
    label?: string[]
    until?: string
  }
}

/**
 * Stats options
 */
export interface StatsOptions {
  stream?: boolean
  'one-shot'?: boolean
}

/**
 * Change type
 */
export enum ChangeType {
  Modified = 0,
  Added = 1,
  Deleted = 2,
}
