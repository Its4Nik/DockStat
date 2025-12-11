import { sleep } from "./config"
const BASE_URL = process.env.OUTLINE_BASE_URL || "https://app.getoutline.com"
const API_KEY = process.env.OUTLINE_API_KEY || ""
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
}

import { logger } from "../bin/cli"
import type {
  Collection,
  CollectionResponse,
  Document,
  DocumentResponse,
  DocumentWithPoliciesResponse,
  SingleDocumentResponse,
} from "./types"

/**
 * Make a POST request to the Outline API with simple retry/backoff logic.
 */
async function outlineRequest<T>(
  endpoint: string,
  body: Record<string, unknown>,
  retries = 3
): Promise<T> {
  const url = `${BASE_URL}/api/${endpoint}`

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      logger.debug(`Outline request: POST ${url} (attempt ${attempt + 1})`)
      logger.debug(`Payload (trimmed): ${JSON.stringify(body, null, 2)}`)

      const res = await fetch(url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body),
      })

      if (res.status === 429) {
        const backoff = 1000 * (attempt + 1)
        logger.warn(
          `Rate limited by Outline API. Backing off ${backoff}ms (attempt ${attempt + 1}).`
        )
        await sleep(backoff)
        continue
      }

      let json: Record<string, unknown>
      try {
        json = await res.json()
      } catch (parseErr) {
        logger.error(`Failed to parse JSON response from ${endpoint}: ${parseErr}`)
        throw parseErr
      }

      if (!res.ok) {
        // Log useful context but avoid leaking sensitive headers/keys
        logger.error(
          `[Outline@${BASE_URL}/api/${endpoint}] HTTP ${res.status} - payload=${JSON.stringify(body)} response=${JSON.stringify(json)}`
        )
        throw new Error(`Outline API error ${res.status}: ${JSON.stringify(json)}`)
      }

      logger.debug(
        `Outline response for ${endpoint} (attempt ${attempt + 1}): ${JSON.stringify(json).slice(0, 200)}${JSON.stringify(json).length > 200 ? "..." : ""}`
      )
      return json as T
    } catch (err: unknown) {
      // last attempt -> rethrow
      if (attempt === retries - 1) {
        logger.error(
          `Request to Outline failed after ${retries} attempts: ${(err as Error)?.message ?? err}`
        )
        throw err
      }
      const backoff = 500 * (attempt + 1)
      logger.warn(
        `Request failed (attempt ${attempt + 1}): ${(err as Error)?.message ?? err}. Retrying after ${backoff}ms...`
      )
      await sleep(backoff)
    }
  }

  // Should be unreachable, but keep the error for TypeScript
  throw new Error("outlineRequest: unreachable")
}

export async function listCollectionsPaged(): Promise<{ id: string; name: string }[]> {
  const out: { id: string; name: string }[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const json = await outlineRequest<CollectionResponse>("collections.list", { offset, limit })
    const data = json.data || []
    for (const c of data) out.push({ id: c.id, name: c.name })
    if (data.length < limit) break
    offset += data.length
  }
  logger.debug(`listCollectionsPaged: returned ${out.length} collections`)
  return out
}

export async function listDocumentsInCollection(collectionId: string): Promise<Document[]> {
  const out: Document[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const json = await outlineRequest<DocumentResponse>("documents.list", {
      collectionId,
      offset,
      limit,
    })
    const data = json.data || []
    for (const d of data) {
      out.push(d)
    }
    if (data.length < limit) {
      break
    }
    offset += data.length
  }
  logger.debug(`listDocumentsInCollection(${collectionId}): returned ${out.length} documents`)
  return out
}

export async function fetchDocumentInfo(documentId: string) {
  const json = await outlineRequest<SingleDocumentResponse>("documents.info", { id: documentId })
  logger.debug(`fetchDocumentInfo(${documentId}) -> ${json ? "ok" : "null"}`)
  return json.data ?? null
}

export async function createDocument(
  title: string,
  text: string,
  collectionId: string,
  parentDocumentId: string | null
) {
  const payload = {
    title,
    text,
    collectionId,
    parentDocumentId: parentDocumentId || null,
    publish: true,
  }
  const json = await outlineRequest<DocumentWithPoliciesResponse>("documents.create", payload)
  logger.info(
    `Created document "${title}" in collection ${collectionId} (id=${json?.data.id ?? "unknown"})`
  )
  return json.data
}

export async function updateDocument(id: string, title: string | undefined, text: string) {
  const payload: Record<string, unknown> = { id, text, publish: true }
  if (title) {
    payload.title = title
  }
  const json = await outlineRequest<DocumentWithPoliciesResponse>("documents.update", payload)
  logger.info(`Updated document id=${id}${title ? ` title="${title}"` : ""}`)
  return json.data
}
