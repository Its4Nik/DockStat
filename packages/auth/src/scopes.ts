import { type AuthUser, ROLE_RANK, type Role } from "./types"

/**
 * Error thrown by the guard helpers. Carries the HTTP status a route should
 * answer with (401 unauthenticated, 403 insufficient role/scope).
 */
export class AuthError extends Error {
  readonly status: 401 | 403

  constructor(message: string, status: 401 | 403) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

/** Parses a space-separated scope string (`"docker:read docker:write"`). */
export function parseScopes(scopes: string | null | undefined): string[] {
  if (!scopes) return []
  return scopes
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean)
}

/**
 * Whether a single granted scope satisfies a needed one.
 * Supports `prefix:*` and the global `*` wildcards.
 *
 * - `docker:read` satisfies `docker:read`
 * - `docker:*`     satisfies `docker:read` and `docker:write`
 * - `*`            satisfies anything
 */
export function scopeMatches(granted: string, needed: string): boolean {
  if (granted === needed || granted === "*") return true
  if (granted.endsWith(":*")) return needed.startsWith(`${granted.slice(0, -1)}`)
  return false
}

/** Whether all `needed` scopes are covered by `granted`. */
export function hasScopes(granted: string[] | string, needed: string[] | string): boolean {
  const grantedList = Array.isArray(granted) ? granted : parseScopes(granted)
  const neededList = Array.isArray(needed) ? needed : parseScopes(needed)
  if (neededList.length === 0) return true
  return neededList.every((n) => grantedList.some((g) => scopeMatches(g, n)))
}

/** Role rank; built-in roles rank hierarchically, custom roles rank lowest. */
export function roleRank(role: Role): number {
  return ROLE_RANK[role] ?? 0
}

/**
 * Whether the user holds at least the given role tier
 * (`admin` satisfies `editor`, `editor` satisfies `viewer`).
 */
export function hasRole(user: AuthUser | null | undefined, role: Role): boolean {
  if (!user) return false
  return user.roles.some((granted) => roleRank(granted) >= roleRank(role))
}

/** Whether the user holds any of the given role tiers. */
export function hasAnyRole(user: AuthUser | null | undefined, ...roles: Role[]): boolean {
  return roles.some((role) => hasRole(user, role))
}

// ── Guards (throw AuthError) ────────────────────────────────────────

/** Returns the user or throws a 401 `AuthError`. */
export function requireAuth(user: AuthUser | null | undefined): AuthUser {
  if (!user) throw new AuthError("Authentication required", 401)
  return user
}

/** Returns the user if it holds at least the role tier, else throws 403. */
export function requireRole(user: AuthUser | null | undefined, role: Role): AuthUser {
  const authed = requireAuth(user)
  if (!hasRole(authed, role)) {
    throw new AuthError(`Role "${role}" or higher required`, 403)
  }
  return authed
}

/** Returns the user if it covers all needed scopes, else throws 403. Admins always pass. */
export function requireScopes(
  user: AuthUser | null | undefined,
  scopes: string[] | string
): AuthUser {
  const authed = requireAuth(user)
  if (hasRole(authed, "admin")) return authed
  if (!hasScopes(authed.scopes, scopes)) {
    throw new AuthError(
      `Missing required scope(s): ${Array.isArray(scopes) ? scopes.join(" ") : scopes}`,
      403
    )
  }
  return authed
}
