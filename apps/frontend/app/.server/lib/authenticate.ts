import { verifyAuthToken } from "@dockstat/auth"
import { Singletons } from "../singletons"

export interface AuthUser {
  sub: string
  email?: string
  name?: string
  picture?: string
  authMethod?: "jwt" | "apikey"
  scopes?: string
  [key: string]: unknown
}

const isSessionValid = (jti?: string) => {
  if (!jti) return true
  return Singletons.Auth.Handler.sessions.where({ jti }).exists()
}

async function validateApiKey(apiKey: string): Promise<{ userId: string; scopes: string } | null> {
  const allKeys = Singletons.Auth.Handler.apiKeys
    .select(["id", "userId", "keyHash", "scopes", "expiresAt", "revokedAt"])
    .all()

  for (const keyRecord of allKeys) {
    const isValid = await Bun.password.verify(apiKey, keyRecord.keyHash)
    if (isValid) {
      if (keyRecord.revokedAt) return null
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return null
      Singletons.Auth.Handler.apiKeys.update({ id: keyRecord.id, lastUsedAt: new Date() })
      return { scopes: keyRecord.scopes, userId: keyRecord.userId }
    }
  }
  return null
}

/**
 * Authenticate a request via Bearer JWT, `Api-Key`/`X-API-Key` header or
 * the `auth_token` cookie. Returns null when unauthenticated.
 */
export async function authenticate(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization")
  const url = new URL(request.url)

  let token: string | null = url.searchParams.get("token")
  let apiKey: string | null = null

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7)
  } else if (authHeader?.startsWith("Api-Key ")) {
    apiKey = authHeader.slice(8)
  }

  if (!apiKey && !token) apiKey = request.headers.get("X-API-Key")

  if (!apiKey && !token) {
    const cookie = request.headers.get("Cookie") ?? ""
    const match = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/)
    token = match ? decodeURIComponent(match[1]) : null
  }

  if (token) {
    const payload = await verifyAuthToken(token)
    if (payload && typeof payload.user === "object" && payload.user !== null) {
      if (!isSessionValid(payload.jti as string | undefined)) return null
      return { ...(payload.user as AuthUser), authMethod: "jwt" }
    }
  }

  if (apiKey) {
    const keyValidation = await validateApiKey(apiKey)
    if (keyValidation) {
      return { authMethod: "apikey", scopes: keyValidation.scopes, sub: keyValidation.userId }
    }
  }

  return null
}
