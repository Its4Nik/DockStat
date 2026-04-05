import type { CreateRepoType, PluginMetaType } from "@dockstat/typings/types"

export interface Opts extends Omit<CreateRepoType, "source"> {
  root: string
  themes: { dir: string }
  plugins: { dir: string; bundle: string }
  stacks: { dir: string }
}

export interface RepoFile extends Record<string, unknown> {
  config: Omit<Opts, "root">
  content: {
    plugins: PluginMetaType[]
    themes: unknown[]
    stacks: StackMetaType[]
  }
}

export interface BuildResult {
  name: string
  success: boolean
  meta?: PluginMetaType
  error?: string
}

// ============================================
// Stack Types
// ============================================

/** Stack metadata type for repository listing */
export interface StackMetaType {
  /** Unique identifier for the stack */
  id: string
  /** Display name of the stack */
  name: string
  /** Stack description */
  description?: string
  /** Version of the stack */
  version: string
  /** Author information */
  author?: string
  /** Repository URL where the stack is hosted */
  repository?: string
  /** Tags for categorizing the stack */
  tags?: string[]
  /** Path to the stack file relative to stacks directory */
  path: string
  /** Minimum Docker version required */
  minDockerVersion?: string
  /** Whether the stack supports Docker Swarm */
  swarmSupport?: boolean
  /** Environment variables schema */
  envSchema?: EnvVariableSchema[]
  /** Services defined in the stack */
  services?: StackServiceInfo[]
  /** Screenshots or preview images */
  screenshots?: string[]
  /** Homepage URL */
  homepage?: string
  /** License */
  license?: string
  /** Last updated timestamp */
  updatedAt?: string
}

/** Environment variable schema definition */
export interface EnvVariableSchema {
  /** Variable name */
  name: string
  /** Description of what the variable does */
  description?: string
  /** Default value */
  default?: string | number | boolean
  /** Whether this variable is required */
  required?: boolean
  /** List of valid options for enum-like variables */
  options?: string[]
  /** Minimum value for numeric variables */
  min?: number
  /** Maximum value for numeric variables */
  max?: number
  /** Validation regex pattern */
  pattern?: string
  /** Variable group for UI organization */
  group?: string
  /** Whether this variable is a secret (sensitive data) */
  secret?: boolean
}

/** Service information in a stack */
export interface StackServiceInfo {
  /** Service name */
  name: string
  /** Image used by the service */
  image: string
  /** Ports exposed by the service */
  ports?: number[]
  /** Environment variables used by the service */
  envVars?: string[]
  /** Volume mounts */
  volumes?: string[]
  /** Whether the service depends on other services */
  dependsOn?: string[]
}

/** Stack bundle result */
export interface StackBuildResult {
  name: string
  success: boolean
  meta?: StackMetaType
  error?: string
}

/** Stack download options */
export interface StackDownloadOptions {
  /** Stack ID or name to download */
  stack: string
  /** Target directory to save the stack */
  output: string
  /** Whether to overwrite existing files */
  overwrite?: boolean
  /** Whether to include example environment file */
  includeEnvExample?: boolean
  /** Custom environment values to pre-fill */
  envValues?: Record<string, string | number | boolean>
}

/** Stack validation result */
export interface StackValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  services: string[]
  envVars: string[]
}

// cli/types.ts (add or update)
export interface BadgeOptions {
  label: string
  message: string
  color: string
  labelColor?: string
  style?: "flat" | "flat-square"
  icon?: string
}
