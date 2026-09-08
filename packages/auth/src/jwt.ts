import { jwtVerify, SignJWT } from "jose"
import { AUTH_AUDIENCE, AUTH_ISSUER, JWT_SECRET, WS_TOKEN_AUDIENCE } from "./env"
import type { AuthUser, Role, SessionClaims } from "./types"

export interface SessionPayload extends SessionClaims {
  jti: string
  iat: number
  exp: number
  iss: string
  aud: string
}

export interface WsTokenPayload {
  sub: string
  name?: string
  email?: string
  picture?: string
  provider: string
  roles: Role[]
  scopes: string[]
  iat: number
  exp: number
  iss: string
  aud: string
}

const HEADER = { alg: "HS256", typ: "JWT" } as const

async function sign(
  claims: Record<string, unknown>,
  audience: string,
  ttlSec: number,
  jti?: string
): Promise<string> {
  const builder = new SignJWT(claims)
    .setProtectedHeader(HEADER)
    .setIssuer(AUTH_ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
  if (jti) builder.setJti(jti)
  return builder.sign(JWT_SECRET)
}

async function verify<T>(token: string, audience: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      audience,
      issuer: AUTH_ISSUER,
    })
    return payload as unknown as T
  } catch {
    return null
  }
}

/** Signs a tracked session JWT (the `jti` links it to a sessions-table row). */
export function signSessionToken(
  claims: SessionClaims,
  jti: string,
  ttlSec: number
): Promise<string> {
  return sign({ ...claims, roles: claims.roles, scopes: claims.scopes }, AUTH_AUDIENCE, ttlSec, jti)
}

/** Verifies a session JWT (issuer/audience/algorithm enforced). */
export function verifySessionToken(token: string): Promise<SessionPayload | null> {
  return verify<SessionPayload>(token, AUTH_AUDIENCE)
}

/**
 * Signs a short-lived token for WebSocket connections. WebSocket clients
 * (especially cross-origin ones) can't always send cookies, so they exchange
 * their session for one of these via the `ws-token` endpoint. The distinct
 * audience keeps WS tokens from being reused as session bearers.
 */
export function signWsToken(claims: SessionClaims, ttlSec: number): Promise<string> {
  return sign({ ...claims }, WS_TOKEN_AUDIENCE, ttlSec)
}

/** Verifies a WS token. */
export function verifyWsToken(token: string): Promise<WsTokenPayload | null> {
  return verify<WsTokenPayload>(token, WS_TOKEN_AUDIENCE)
}

/** Re-signs identical claims with a fresh `iat`/`exp` (sliding sessions). */
export function refreshSessionToken(payload: SessionPayload, ttlSec: number): Promise<string> {
  const { jti, iat: _iat, exp: _exp, iss: _iss, aud: _aud, ...claims } = payload
  return sign(claims, AUTH_AUDIENCE, ttlSec, jti)
}

/** Maps a verified session payload to an `AuthUser`. */
export function sessionPayloadToUser(payload: SessionPayload): AuthUser {
  return {
    authMethod: "session",
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    provider: payload.provider,
    roles: payload.roles ?? [],
    scopes: payload.scopes ?? [],
    sub: payload.sub,
  }
}
