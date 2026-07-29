import type { WidgetDefinition } from "./widget"

// ── Widget Manifest (for import/export) ────────────────────────────

export interface WidgetManifest {
  /** Manifest format version */
  manifestVersion: string
  /** Information about the creator */
  author: ManifestAuthor
  /** List of widget definitions contained in this pack */
  widgets: WidgetDefinition[]
}

export interface ManifestAuthor {
  name: string
  email?: string
  url?: string
}

// ── Dashboard Export Manifest ───────────────────────────────────────

export interface DashboardExportManifest {
  /** Manifest format version */
  manifestVersion: string
  /** Information about the creator */
  author: ManifestAuthor
  /** The dashboard definition (JSON-serializable) */
  dashboard: DashboardExportData
  /** Optional: bundled widget definitions that are referenced */
  bundledWidgets?: WidgetDefinition[]
}

// ── Dashboard export data (self-contained, no runtime refs) ────────

export interface DashboardExportData {
  name: string
  label: string
  description: string
  widgets: unknown[]
  layouts: unknown
  dataPipe: unknown
}

// Re-import for use here without circular dependency
import type { DashboardDefinition } from "./dashboard"
export type { DashboardDefinition }

// ── Import validation result ────────────────────────────────────────

export interface ImportResult<T = unknown> {
  success: boolean
  /** Human-readable messages */
  messages: string[]
  /** Warnings (non-blocking issues) */
  warnings: string[]
  /** The imported / parsed entities */
  data?: T[]
  /** Errors that prevented the import */
  errors: string[]
}
