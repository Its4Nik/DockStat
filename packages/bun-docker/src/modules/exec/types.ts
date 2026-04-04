// ============================================================================
// Exec Types
// ============================================================================

/**
 * Exec instance create options
 */
export interface ExecCreateOptions {
  AttachStdin?: boolean
  AttachStdout?: boolean
  AttachStderr?: boolean
  ConsoleSize?: [number, number] | null
  DetachKeys?: string
  Tty?: boolean
  Env?: string[]
  Cmd?: string[]
  Privileged?: boolean
  User?: string
  WorkingDir?: string
}

/**
 * Exec create response
 */
export interface ExecCreateResponse {
  Id: string
}

/**
 * Exec start options
 */
export interface ExecStartOptions {
  Detach?: boolean
  Tty?: boolean
  ConsoleSize?: [number, number] | null
}

/**
 * Exec inspect response
 */
export interface ExecInspectResponse {
  CanRemove: boolean
  DetachKeys: string
  ID: string
  Running: boolean
  ExitCode: number
  ProcessConfig: ProcessConfig
  OpenStdin: boolean
  OpenStderr: boolean
  OpenStdout: boolean
  ContainerID: string
  Pid: number
}

/**
 * Process configuration
 */
export interface ProcessConfig {
  arguments: string[]
  entrypoint: string
  privileged: boolean
  tty: boolean
  user: string
}
