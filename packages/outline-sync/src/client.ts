import type { Collection, Document, OutlineConfig, ClientRequestOptions } from "./types"
import { c, icon, formatDuration, truncate } from "./ui"

interface ParsedError {
  status: number
  error?: string
  message?: string
  data?: Record<string, unknown>
}

export class OutlineApiError extends Error {
  public readonly status: number
  public readonly code?: string
  public readonly apiData?: Record<string, unknown>

  constructor(parsed: ParsedError) {
    const msg = parsed.message
      ? `Outline API ${parsed.status}: ${parsed.error ?? "error"} \u2013 ${parsed.message}`
      : `Outline API ${parsed.status}: ${parsed.error ?? parsed.message ?? "unknown error"}`
    super(msg)
    this.name = "OutlineApiError"
    this.status = parsed.status
    this.code = parsed.error
    this.apiData = parsed.data
  }
}

export class OutlineClient {
  private baseUrl: string
  private token: string
  private verbose: boolean
  private requestCount = 0

  constructor(config: OutlineConfig, verbose?: boolean) {
    this.baseUrl = config.url.replace(/\/$/, "")
    this.token = config.token
    this.verbose = Boolean(verbose ?? config.verbose)

    this.trace("OutlineClient initialized", {
      baseUrl: this.baseUrl,
      tokenPrefix: `${this.token.slice(0, 4)}\u2026`,
    })
  }

  // ── Trace logging ──────────────────────────────────────────────────────

  private trace(message: string, meta?: unknown): void {
    if (!this.verbose) return
    const ts = new Date().toISOString()
    const prefix = c.dim(`[trace ${ts}]`)
    if (meta === undefined) {
      console.log(`${prefix} [API] ${message}`)
      return
    }
    console.log(`${prefix} [API] ${message}`, JSON.stringify(meta, null, 2))
  }

  // ── Core request ───────────────────────────────────────────────────────

  private async request<T>(
    endpoint: string,
    data?: Record<string, unknown>,
    options?: ClientRequestOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}/api/${endpoint}`
    const maxRetries = options?.retries ?? 2
    const retryDelay = options?.retryDelayMs ?? 1000
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = performance.now()

      this.trace(`request: ${endpoint}`, {
        attempt: attempt + 1,
        body: data,
        method: "POST",
        url,
      })

      try {
        const response = await fetch(url, {
          body: data ? JSON.stringify(data) : undefined,
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        })

        const duration = performance.now() - startTime
        const durationStr = formatDuration(duration)

        // ── Read response body (always, even on error) ──────────────────
        const bodyText = await response.text()
        let bodyJson: Record<string, unknown> | null = null
        try {
          bodyJson = JSON.parse(bodyText)
        } catch {
          // non-JSON response
        }

        if (!response.ok) {
          const parsed: ParsedError = {
            status: response.status,
            error: (bodyJson?.error as string) ?? undefined,
            message: (bodyJson?.message as string) ?? undefined,
            data: (bodyJson?.data as Record<string, unknown>) ?? undefined,
          }

          this.trace(`request failed: ${endpoint}`, {
            durationMs: durationStr,
            response: bodyJson ?? bodyText.slice(0, 500),
            status: response.status,
            statusText: response.statusText,
          })

          // Retry on 429 (rate limit) and 5xx (server error), but NOT on 4xx client errors
          const isRetryable = response.status === 429 || response.status >= 500
          if (isRetryable && attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt)
            this.trace(`retrying in ${delay}ms`, { attempt: attempt + 1, endpoint })
            await new Promise((r) => setTimeout(r, delay))
            continue
          }

          lastError = new OutlineApiError(parsed)
          break
        }

        this.requestCount++

        this.trace(`request success: ${endpoint}`, {
          durationMs: durationStr,
          status: response.status,
        })

        return (bodyJson ?? {}) as T
      } catch (err) {
        const duration = performance.now() - startTime
        this.trace(`request exception: ${endpoint}`, {
          durationMs: formatDuration(duration),
          error: String(err),
        })

        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt)
          this.trace(`retrying in ${delay}ms`, { attempt: attempt + 1, endpoint })
          await new Promise((r) => setTimeout(r, delay))
          continue
        }

        lastError = err instanceof Error ? err : new Error(String(err))
        break
      }
    }

    throw lastError ?? new Error("Request failed with no error recorded")
  }

  // ── Public API ─────────────────────────────────────────────────────────

  async getCollections(): Promise<Collection[]> {
    this.trace("getCollections: fetching")
    const result = await this.request<{ data: Collection[] }>("collections.list")
    this.trace("getCollections: completed", {
      count: result.data.length,
      names: result.data.map((c) => truncate(c.name, 25)),
    })
    return result.data
  }

  async getDocuments(collectionId?: string): Promise<Document[]> {
    this.trace("getDocuments: fetching", { collectionId })
    const result = await this.request<{ data: Document[] }>(
      "documents.list",
      collectionId ? { collectionId } : {},
    )
    this.trace("getDocuments: completed", {
      collectionId,
      count: result.data.length,
    })
    return result.data
  }

  async getDocument(id: string): Promise<Document> {
    this.trace("getDocument: fetching", { id })
    const result = await this.request<{ data: Document }>("documents.info", { id })
    this.trace("getDocument: completed", {
      id: result.data.id,
      textLength: result.data.text?.length ?? 0,
      title: truncate(result.data.title, 30),
      updatedAt: result.data.updatedAt,
    })
    return result.data
  }

  async updateDocument(
    id: string,
    text: string,
    options?: { title?: string; publish?: boolean },
  ): Promise<Document> {
    const body: Record<string, unknown> = {
      id,
      text,
    }

    if (options?.title !== undefined) {
      body.title = options.title
    }

    // Only send publish: true if explicitly requested; many Outline
    // configurations reject the update when publish is sent on already-
    // published docs, or when the user doesn't have publish permissions.
    if (options?.publish === true) {
      body.publish = true
    }

    this.trace("updateDocument: updating", {
      id,
      publish: options?.publish ?? false,
      textLength: text.length,
      title: options?.title,
    })

    const result = await this.request<{ data: Document }>("documents.update", body, {
      retries: 1, // fewer retries for mutations
    })

    this.trace("updateDocument: completed", {
      id: result.data.id,
      title: truncate(result.data.title, 30),
      updatedAt: result.data.updatedAt,
    })

    return result.data
  }

  async createDocument(params: {
    collectionId: string
    title: string
    text: string
    parentDocumentId?: string
    publish?: boolean
  }): Promise<Document> {
    const body: Record<string, unknown> = {
      collectionId: params.collectionId,
      publish: params.publish ?? true,
      text: params.text,
      title: params.title,
    }

    if (params.parentDocumentId) {
      body.parentDocumentId = params.parentDocumentId
    }

    this.trace("createDocument: creating", {
      collectionId: params.collectionId,
      parentDocumentId: params.parentDocumentId,
      textLength: params.text.length,
      title: truncate(params.title, 30),
    })

    const result = await this.request<{ data: Document }>("documents.create", body)

    this.trace("createDocument: completed", {
      id: result.data.id,
      title: truncate(result.data.title, 30),
    })

    return result.data
  }

  /** Check if a document exists on Outline and return its current state. */
  async documentExists(id: string): Promise<Document | null> {
    try {
      return await this.getDocument(id)
    } catch {
      return null
    }
  }

  /** Get total number of API requests made. */
  getRequestCount(): number {
    return this.requestCount
  }
}