// ── Roles ──────────────────────────────────────────────────────────

/**
 * Built-in roles. Custom roles are allowed (rank defaults to the lowest
 * tier); extend the union via declaration merging or use plain strings.
 */
export type BuiltinRole = "admin" | "editor" | "viewer"
export type Role = BuiltinRole | (string & {})

/** Higher rank implies every lower tier (`admin` >= `editor` >= `viewer`). */
export const ROLE_RANK: Record<string, number> = {
  admin: 100,
  editor: 50,
  viewer: 10,
}

// ── Authenticated identity ──────────────────────────────────────────

/** How the request authenticated. */
export type AuthMethod = "session" | "apikey"

/** The authenticated identity attached to a request. */
export interface AuthUser {
  /** Stable subject id (local user id, OIDC `sub` or api-key owner). */
  sub: string
  name?: string
  email?: string
  picture?: string
  /** Where the identity came from: `"local"`, an OIDC provider id or `"apikey"`. */
  provider: string
  roles: Role[]
  /** Granted scopes (API keys are scoped; sessions may carry scopes too). */
  scopes: string[]
  authMethod: AuthMethod
  /** Open claim surface (WS handlers pass the user through as a record). */
  [key: string]: unknown
}

/** Claims embedded in a session JWT. */
export interface SessionClaims {
  sub: string
  name?: string
  email?: string
  picture?: string
  provider: string
  roles: Role[]
  scopes: string[]
}

// ── Tables (column names must stay stable — see table schema below) ─

export type ProvidersTable = {
  id: string
  name: string | null
  icon: string | null
  issuer_url: string
  client_id: string
  client_secret: string
  scopes: string
  created_at: Date
  logout_url: string | null
}

export type UsersTable = {
  id: string
  name: string
  passHash: string
  /** Identity origin: `"local"` or an OIDC provider id. */
  provider: string
  /** External subject id (OIDC `sub`); null for local users. */
  externalId: string | null
  roles: string
  createdAt: Date
  updatedAt: Date
}

export type ApiKeysTable = {
  id: string
  userId: string
  name: string
  keyHash: string
  scopes: string
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  revokedAt: Date | null
}

export type SessionsTable = {
  id: string
  jti: string
  userId: string
  createdAt: Date
  expiresAt: Date
}

// ── Options ─────────────────────────────────────────────────────────

export interface AuthServiceOptions {
  /** Session lifetime in seconds (default 1 day). */
  sessionTtlSec?: number
  /** Lifetime of short-lived WS tokens in seconds (default 60). */
  wsTokenTtlSec?: number
  /** Session cookie name (default `auth_token`). */
  cookieName?: string
  /** JWT issuer claim (default `dockstat`). */
  issuer?: string
  /** Roles assigned to newly registered users (default `["viewer"]`). */
  defaultRoles?: Role[]
  /** Role assigned to the very first user (default `admin`). */
  firstUserRole?: Role
  /** Resolves whether guest registration is currently allowed. */
  getAllowGuestRegistration?: () => boolean
  /** Sets the allow guest registration state. */
  setAllowGuestRegistration?: (enable: boolean) => void
}
