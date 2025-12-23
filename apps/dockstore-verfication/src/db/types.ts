/**
 * Database schema types for the plugin verification system
 */

/**
 * Base interface for database records with index signature
 */
interface DbRecord {
  [key: string]: unknown
}

/**
 * Repository record - represents a dockstore repository that can be verified
 */
export interface Repository extends DbRecord {
  id?: number
  name: string
  url: string
  enabled: boolean
  created_at?: number
  updated_at?: number
}

/**
 * Plugin record - represents a plugin that can be verified
 */
export interface Plugin extends DbRecord {
  id?: number
  repository_id: number
  name: string
  description: string
  author_name: string
  author_email?: string
  author_website?: string
  license: string
  repository_url: string
  repo_type: "github" | "gitlab" | "http"
  manifest_path: string
  created_at?: number
  updated_at?: number
}

/**
 * Plugin version record - represents a specific version of a plugin
 */
export interface PluginVersion extends DbRecord {
  id?: number
  plugin_id: number
  version: string
  hash: string
  bundle_hash?: string
  tags?: string[]
  created_at?: number
}

/**
 * Verification record - represents a verification of a plugin version
 */
export interface Verification extends DbRecord {
  id?: number
  plugin_version_id: number
  verified: boolean
  verified_by: string
  verified_at?: number
  notes?: string
  security_status: "safe" | "unsafe" | "unknown"
}

/**
 * Combined view for displaying plugin verification status
 */
export interface PluginVerificationView {
  plugin_id: number
  plugin_name: string
  description: string
  author_name: string
  author_email?: string
  author_website?: string
  license: string
  repository_url: string
  repo_type: "github" | "gitlab" | "http"
  version: string
  version_hash: string
  bundle_hash?: string
  tags?: string[]
  verified: boolean
  verified_by?: string
  verified_at?: number
  security_status: "safe" | "unsafe" | "unknown"
  notes?: string
}

/**
 * Repository with verification statistics
 */
export interface RepositoryWithStats extends Repository {
  total_plugins: number
  verified_plugins: number
  total_versions: number
  verified_versions: number
}

/**
 * Table column definitions type helpers
 */
export type RepositoryColumns = keyof Repository
export type PluginColumns = keyof Plugin
export type PluginVersionColumns = keyof PluginVersion
export type VerificationColumns = keyof Verification
