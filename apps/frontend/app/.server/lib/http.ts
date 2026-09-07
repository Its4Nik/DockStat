import { data } from "react-router"

/** JSON response with optional status */
export const ok = <_T>(body: _T, status = 200) => data(body, { status })

/** JSON error response */
export const fail = (status: number, message: string, extra?: Record<string, unknown>) =>
  data({ error: message, message, success: false, ...extra }, { status })

/**
 * Parse a JSON request body, tolerating empty/invalid bodies.
 * Binary (zip/octet-stream) bodies fall back to `{ archive }`.
 */
export async function parseBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    if (contentType.includes("octet-stream") || contentType.includes("zip")) {
      return { archive: new Uint8Array(await request.arrayBuffer()) } as T
    }
    return {} as T
  }
  try {
    return (await request.json()) as T
  } catch {
    return {} as T
  }
}

export const query = (request: Request) => new URL(request.url).searchParams

export const numParam = (value: string | undefined): number => {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) throw new Error(`Invalid numeric parameter: ${value}`)
  return parsed
}

/** Convert Unix timestamp (seconds) fields to ISO 8601 strings for JSON responses */
export const serializeDates = <T extends Record<string, unknown>>(
  row: T,
  dateFields: (keyof T)[]
): T => {
  const result = { ...row }
  for (const field of dateFields) {
    const value = result[field]
    if (value !== null && value !== undefined && typeof value === "number") {
      ;(result as Record<string, unknown>)[field as string] = new Date(value * 1000).toISOString()
    }
  }
  return result
}

/** Minimal RR route handler args shape the Loaders/Actions facades rely on */
export interface RouteArgs<
  P extends Record<string, string | undefined> = Record<string, string | undefined>,
> {
  request: Request
  params: P
}
