/**
 * Single source of truth for where credentials live.
 *
 * Extraction precedence (per request):
 *   1. `Authorization: Bearer <jwt>` / `Authorization: Api-Key <key>`
 *   2. `X-API-Key: <key>`
 *   3. `?token=<jwt>` query param (WebSocket upgrades can't set headers)
 *   4. `auth_token` session cookie (browser/SSR)
 */

export const DEFAULT_SESSION_COOKIE = "auth_token"

export type ExtractedCredentials = { kind: "jwt" | "apikey"; value: string }

/** Reads a single cookie value from a `Cookie` header. */
export function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie")
  if (!cookie) return null
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Extracts whichever credential the request carries, or null.
 * This is the ONLY place that knows about headers, query params and cookies.
 */
export function extractCredentials(
  request: Request,
  cookieName: string = DEFAULT_SESSION_COOKIE
): ExtractedCredentials | null {
  const header = request.headers.get("authorization")
  if (header?.startsWith("Bearer ")) return { kind: "jwt", value: header.slice(7).trim() }
  if (header?.startsWith("Api-Key ")) return { kind: "apikey", value: header.slice(8).trim() }

  const apiKey = request.headers.get("x-api-key")
  if (apiKey) return { kind: "apikey", value: apiKey.trim() }

  const queryToken = new URL(request.url).searchParams.get("token")
  if (queryToken) return { kind: "jwt", value: queryToken }

  const cookieToken = readCookie(request, cookieName)
  if (cookieToken) return { kind: "jwt", value: cookieToken }

  return null
}

// ── Serialization ───────────────────────────────────────────────────

export interface CookieOptions {
  maxAge?: number
  path?: string
  httpOnly?: boolean
  sameSite?: "strict" | "lax" | "none"
}

/** Whether the request arrived over HTTPS (honors proxy headers). */
export function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto")
  if (proto) return proto.split(",")[0].trim() === "https"
  return new URL(request.url).protocol === "https:"
}

/** Serializes one `Set-Cookie` header value. `secure` follows the request scheme. */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions,
  secure = false
): string {
  const { maxAge = -1, path = "/", httpOnly = true, sameSite = "lax" } = options
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}`
  if (httpOnly) cookie += "; HttpOnly"
  if (secure) cookie += "; Secure"
  cookie += `; SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`
  if (maxAge >= 0) cookie += `; Max-Age=${maxAge}`
  return cookie
}

/** The session cookie: HttpOnly + SameSite=Lax, Secure on HTTPS. */
export function sessionCookie(
  token: string,
  maxAgeSec: number,
  secure: boolean,
  cookieName: string = DEFAULT_SESSION_COOKIE
): string {
  return serializeCookie(cookieName, token, { maxAge: maxAgeSec }, secure)
}

/** Expires the session cookie. */
export function clearSessionCookie(
  secure: boolean,
  cookieName: string = DEFAULT_SESSION_COOKIE
): string {
  return serializeCookie(cookieName, "", { maxAge: 0 }, secure)
}
