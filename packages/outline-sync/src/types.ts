// ── Configuration ──────────────────────────────────────────────────────────

export interface OutlineConfig {
  url: string
  token: string
  outputDir?: string
  customPaths?: Record<string, string>
  includeCollections?: string[]
  excludeCollections?: string[]
  verbose?: boolean
  force?: boolean
  dryRun?: boolean
  createMissing?: boolean
  defaultCollectionId?: string
}

// ── Outline API types ──────────────────────────────────────────────────────

export interface Document {
  id: string
  title: string
  text: string
  collectionId: string
  parentDocumentId: string | null
  publishedAt: string | null
  updatedAt: string
  createdAt: string
  urlId: string
}

export interface Collection {
  id: string
  name: string
  description: string
  sort: Record<string, number>
}

// ── Frontmatter metadata ───────────────────────────────────────────────────

export interface DocumentMetadata {
  id: string
  title: string
  collectionId: string
  parentDocumentId: string | null
  updatedAt: string
  urlId: string
}

// ── API response types ─────────────────────────────────────────────────────

export interface OutlineApiResponse<T> {
  ok: true
  data: T
  status: number
}

// ── Sync result types ──────────────────────────────────────────────────────

export type SyncStatus =
  | "synced"
  | "pushed"
  | "pulled"
  | "new"
  | "created"
  | "conflict"
  | "error"
  | "skipped"
  | "not-found"

export interface SyncResult {
  filePath: string
  documentId: string
  title: string
  status: SyncStatus
  message?: string
  localDate?: Date
  remoteDate?: Date
  source?: "frontmatter" | "mtime" | "remote" | "cache"
}

export interface SyncSummary {
  total: number
  synced: number
  pushed: number
  pulled: number
  created: number
  newFiles: number
  errors: number
  skipped: number
  durationMs: number
}

// ── Internal types ─────────────────────────────────────────────────────────

export interface DocumentNode {
  document: Document
  children: DocumentNode[]
}

export interface ParsedDocument {
  metadata: DocumentMetadata
  body: string
  raw: string
}

export interface ClientRequestOptions {
  retries?: number
  retryDelayMs?: number
}