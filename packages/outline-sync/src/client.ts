import type { Collection, Document, OutlineConfig } from "./types"

export class OutlineClient {
  private baseUrl: string
  private token: string
  private verbose: boolean

  constructor(config: OutlineConfig, verbose?: boolean) {
    this.baseUrl = config.url.replace(/\/$/, "")
    this.token = config.token
    this.verbose = Boolean(verbose)

    this.trace("OutlineClient initialized", {
      baseUrl: this.baseUrl,
      tokenLength: this.token.length,
      tokenPrefix: this.token.slice(0, 4) + "...",
    })
  }

  private trace(message: string, meta?: unknown): void {
    if (!this.verbose) return
    const timestamp = new Date().toISOString()
    if (meta === undefined) {
      console.log(`[trace ${timestamp}] [API] ${message}`)
      return
    }
    console.log(`[trace ${timestamp}] [API] ${message}`, JSON.stringify(meta, null, 2))
  }

  private async request<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/api/${endpoint}`
    const startTime = performance.now()

    this.trace(`request: ${endpoint}`, {
      url,
      method: "POST",
      hasBody: !!data,
      body: data,
    })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    const duration = (performance.now() - startTime).toFixed(2)

    if (!response.ok) {
      this.trace(`request failed: ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        durationMs: duration,
      })
      throw new Error(`Outline API error: ${response.status} ${response.statusText}`)
    }

    const result = (await response.json()) as T

    this.trace(`request success: ${endpoint}`, {
      status: response.status,
      durationMs: duration,
    })

    return result
  }

  async getCollections(): Promise<Collection[]> {
    this.trace("getCollections: fetching all collections")
    const result = await this.request<{ data: Collection[] }>("collections.list")
    this.trace("getCollections: completed", {
      count: result.data.length,
      collections: result.data.map((c) => ({ id: c.id, name: c.name })),
    })
    return result.data
  }

  async getDocuments(collectionId?: string): Promise<Document[]> {
    this.trace("getDocuments: fetching documents", { collectionId })
    const result = await this.request<{ data: Document[] }>(
      "documents.list",
      collectionId ? { collectionId } : {}
    )
    this.trace("getDocuments: completed", {
      collectionId,
      count: result.data.length,
      documents: result.data.map((d) => ({
        id: d.id,
        title: d.title,
        parentDocumentId: d.parentDocumentId,
      })),
    })
    return result.data
  }

  async getDocument(id: string): Promise<Document> {
    this.trace("getDocument: fetching document", { id })
    const result = await this.request<{
      data: Document
    }>("documents.info", { id })
    this.trace("getDocument: completed", {
      id: result.data.id,
      title: result.data.title,
      textLength: result.data.text?.length ?? 0,
      updatedAt: result.data.updatedAt,
    })
    return result.data
  }

  async updateDocument(id: string, text: string, title?: string): Promise<Document> {
    this.trace("updateDocument: updating document", {
      id,
      title,
      textLength: text.length,
    })
    const result = await this.request<{ data: Document }>("documents.update", {
      id,
      text,
      title,
      publish: true,
    })
    this.trace("updateDocument: completed", {
      id: result.data.id,
      title: result.data.title,
      updatedAt: result.data.updatedAt,
    })
    return result.data
  }

  async searchDocuments(query: string): Promise<Document[]> {
    this.trace("searchDocuments: searching", { query })
    const result = await this.request<{ data: { document: Document }[] }>("documents.search", {
      query,
    })
    this.trace("searchDocuments: completed", {
      query,
      count: result.data.length,
      results: result.data.map((r) => ({ id: r.document.id, title: r.document.title })),
    })
    return result.data.map((r) => r.document)
  }
}
