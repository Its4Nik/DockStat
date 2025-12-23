import type { PluginMetaType } from "@dockstat/typings/types"

/**
 * Repository manifest structure - contains all plugins in the repository
 */
export interface RepoManifest {
  plugins: PluginMetaType[]
}

/**
 * Plugin build record for tracking build status
 */
export interface PluginBuildRecord {
  name: string
  path: string
  status: BuildStatus
  message?: string
  startedAt?: number
  finishedAt?: number
}

/**
 * Build status enum
 */
export type BuildStatus = "pending" | "building" | "done" | "failed"

/**
 * Error record for tracking build errors
 */
export interface BuildError {
  name: string
  path: string
  message: string
  stack?: string
  phase: BuildPhase
}

/**
 * Build phase enum
 */
export type BuildPhase = "build" | "schema" | "manifest"

/**
 * Plugin content item for markdown rendering
 */
export interface ContentItem {
  name: string
  type: string
  description: string
  version: string
  license: string
  author: {
    name: string
    website?: string
    email?: string
  }
  tags?: string[]
  repository?: string
  path: string
}

/**
 * Plugin meta with build path
 */
export interface PluginMeta extends ContentItem {
  builtPath?: string
  repoType: "github" | "gitlab" | "http"
  manifest: string
}

/**
 * Stack meta for docker compose stacks
 */
export interface StackMeta extends ContentItem {
  composePath?: string
}

/**
 * Theme meta for UI themes
 */
export interface ThemeMeta extends ContentItem {
  cssPath?: string
}

/**
 * Build result from Bun.build
 */
export interface PluginBuildResult {
  ok: boolean
  rec: PluginBuildRecord
  build?: Awaited<ReturnType<typeof Bun.build>>
  error?: Error
}

/**
 * CLI color helpers type
 */
export interface ColorHelpers {
  header: (text: string) => string
  ok: (text: string) => string
  fail: (text: string) => string
  warn: (text: string) => string
  info: (text: string) => string
  dim: (text: string) => string
  active: (text: string) => string
  strong: (text: string) => string
  path: (text: string) => string
}
