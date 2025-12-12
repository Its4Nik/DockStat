import type { Collection, Document, DocumentMetadata, OutlineConfig } from "./types"

export class OutlineClient {
  private baseUrl: string
  private token: string

  constructor(config: OutlineConfig) {
    this.baseUrl = config.url.replace(/\/$/, "")
    this.token = config.token
  }

  private async request<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Outline API error: ${response.status} ${response.statusText}`)
    }

    return (await response.json()) as T
  }

  async getCollections(): Promise<Collection[]> {
    const result = await this.request<{ data: Collection[] }>("collections.list")
    return result.data
  }

  async getDocuments(collectionId?: string): Promise<Document[]> {
    const result = await this.request<{ data: Document[] }>(
      "documents.list",
      collectionId ? { collectionId } : {}
    )
    return result.data
  }

  async getDocument(id: string): Promise<Document> {
    const result = await this.request<{ data: Document }>("documents.info", { id })
    return result.data
  }

  async updateDocument(id: string, text: string, title?: string): Promise<Document> {
    const result = await this.request<{ data: Document }>("documents.update", {
      id,
      text,
      title,
      publish: true,
    })
    return result.data
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const result = await this.request<{ data: { document: Document }[] }>("documents.search", {
      query,
    })
    return result.data.map((r) => r.document)
  }
}
