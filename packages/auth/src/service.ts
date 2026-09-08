import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import { createApiKey, revokeApiKey, verifyApiKey } from "./api-keys"
import {
  clearSessionCookie,
  extractCredentials,
  isSecureRequest,
  readCookie,
  sessionCookie,
} from "./cookies"
import {
  refreshSessionToken,
  sessionPayloadToUser,
  signSessionToken,
  signWsToken,
  verifySessionToken,
  verifyWsToken as verifyWsTokenSignature,
} from "./jwt"
import { type OauthLoginCookies, OidcService } from "./oidc"
import { hashPassword, unusablePasswordHash, verifyPassword } from "./passwords"
import { parseScopes } from "./scopes"
import {
  createSession,
  extendSession,
  isSessionValid,
  pruneExpiredSessions,
  revokeAllSessions,
  revokeSession as revokeSessionRow,
} from "./sessions"
import type {
  ApiKeysTable,
  AuthServiceOptions,
  AuthUser,
  ProvidersTable,
  Role,
  SessionClaims,
  SessionsTable,
  UsersTable,
} from "./types"

export type LocalLoginResult =
  | { ok: true; user: AuthUser; token: string; jti: string; cookie: string }
  | { ok: false; message: string }

export type RegisterResult =
  | { ok: true; user: UsersTable; isFirstUser: boolean; message: string }
  | { ok: false; status: number; message: string }

export interface IssuedSessionCookies {
  token: string
  jti: string
  /** Ready-to-use `Set-Cookie` header value for the session. */
  cookie: string
}

const PRUNE_PROBABILITY = 0.05

/**
 * Framework-agnostic auth service: session JWTs (HttpOnly cookie or Bearer),
 * local users with roles, scoped API keys and the OIDC login flow.
 *
 * Wire it into React Router via `createAuthMiddleware` from
 * `@dockstat/auth/react-router`, or call `authenticate(request)` directly.
 */
export class AuthService {
  readonly providers: QueryBuilder<ProvidersTable>
  readonly users: QueryBuilder<UsersTable>
  readonly apiKeys: QueryBuilder<ApiKeysTable>
  readonly sessions: QueryBuilder<SessionsTable>
  readonly oidc: OidcService

  private readonly logger: Logger
  private readonly options: Required<
    Pick<
      AuthServiceOptions,
      "sessionTtlSec" | "wsTokenTtlSec" | "cookieName" | "issuer" | "firstUserRole"
    >
  > &
    AuthServiceOptions & { defaultRoles: Role[] }

  private guestRegistrationOverride: boolean | null = null

  constructor(db: DB, baseLogger: Logger, options: AuthServiceOptions = {}) {
    this.logger = baseLogger.spawn("Auth")
    this.options = {
      cookieName: options.cookieName ?? "auth_token",
      defaultRoles: options.defaultRoles ?? ["viewer"],
      firstUserRole: options.firstUserRole ?? "admin",
      issuer: options.issuer ?? "dockstat",
      sessionTtlSec: options.sessionTtlSec ?? 86_400,
      wsTokenTtlSec: options.wsTokenTtlSec ?? 60,
      ...options,
    }

    this.logger.info("Initializing Auth Service")

    this.providers = db.createTable<ProvidersTable>(
      "oidc-providers",
      {
        client_id: column.text({ notNull: true }),
        client_secret: column.text({ notNull: true }),
        created_at: column.createdAt(),
        icon: column.text(),
        id: column.uuid({ generateDefault: true }),
        issuer_url: column.text({ notNull: true }),
        logout_url: column.text(),
        name: column.text(),
        scopes: column.text({ default: "openid profile email" }),
      },
      { ifNotExists: true }
    )

    this.users = db.createTable<UsersTable>("users", {
      createdAt: column.createdAt(),
      externalId: column.text(),
      id: column.uuid({ generateDefault: true }),
      name: column.text({ notNull: true, unique: true }),
      passHash: column.text({ notNull: true }),
      provider: column.text({ default: "local" }),
      roles: column.text({ default: this.options.defaultRoles.join(" ") }),
      updatedAt: column.updatedAt(),
    })

    this.apiKeys = db.createTable<ApiKeysTable>("api-keys", {
      createdAt: column.createdAt(),
      expiresAt: column.datetime({ notNull: false }),
      id: column.uuid({ generateDefault: true }),
      keyHash: column.text({ notNull: true }),
      lastUsedAt: column.datetime({ notNull: false }),
      name: column.text({ notNull: true }),
      revokedAt: column.datetime({ notNull: false }),
      scopes: column.text({ default: "*" }),
      userId: column.text({ notNull: true }),
    })

    this.sessions = db.createTable<SessionsTable>(
      "auth-sessions",
      {
        createdAt: column.createdAt(),
        expiresAt: column.datetime({ notNull: true }),
        id: column.uuid({ generateDefault: true }),
        jti: column.text({ notNull: true }),
        userId: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )

    this.oidc = new OidcService(this.providers, baseLogger)

    this.logger.info(
      `Auth Service ready: sessionTtl=${this.options.sessionTtlSec}s, wsTokenTtl=${this.options.wsTokenTtlSec}s, cookie=${this.options.cookieName}, defaultRoles=[${this.options.defaultRoles.join(",")}], firstUserRole=${this.options.firstUserRole}`
    )
  }

  // ── Authentication ────────────────────────────────────────────────

  /**
   * Authenticates a request. Bearer/API-key headers win, then the `?token=`
   * query param (WebSocket upgrades), then the session cookie (SSR).
   * Returns null for anonymous requests — never throws.
   */
  async authenticate(request: Request): Promise<AuthUser | null> {
    const creds = extractCredentials(request, this.options.cookieName)
    if (!creds) {
      this.logger.debug("Authentication skipped: no credentials on request")
      return null
    }

    try {
      if (creds.kind === "apikey") {
        const key = await verifyApiKey(this.apiKeys, creds.value)
        if (!key) {
          this.logger.warn("Authentication failed: api key not valid")
          return null
        }
        this.logger.info(
          `Authenticated via api key: userId=${key.userId}, scopes=[${key.scopes}]`
        )
        return {
          authMethod: "apikey",
          provider: "apikey",
          roles: key.roles,
          scopes: parseScopes(key.scopes),
          sub: key.userId,
        }
      }

      const payload = await verifySessionToken(creds.value)
      if (!payload || !isSessionValid(this.sessions, payload.jti)) {
        this.logger.warn(
          `Authentication failed: sessioninvalid or expired: jti=${payload?.jti ?? "missing"}`
        )
        return null
      }
      this.logger.info(
        `Authenticated via session: sub=${payload.sub}, provider=${payload.provider}, authMethod=session`
      )
      return sessionPayloadToUser(payload)
    } catch (error) {
      // A failed credential lookup must never 500 the request — treat it
      // as anonymous and let the route guard answer with a 401.
      this.logger.warn(`Authentication failed: ${error}`)
      return null
    }
  }

  // ── Sessions ──────────────────────────────────────────────────────

  /** Issues a tracked session and its HttpOnly cookie. */
  async issueSession(claims: SessionClaims, secure: boolean): Promise<IssuedSessionCookies> {
    const jti = crypto.randomUUID()
    const token = await signSessionToken(claims, jti, this.options.sessionTtlSec)
    createSession(this.sessions, jti, claims.sub, this.options.sessionTtlSec)

    this.logger.info(
      `Issued session: sub=${claims.sub}, provider=${claims.provider}, secure=${secure}, cookie=${this.options.cookieName}`
    )

    if (Math.random() < PRUNE_PROBABILITY) {
      try {
        pruneExpiredSessions(this.sessions)
      } catch (error) {
        this.logger.warn(`Session pruning failed: ${error}`)
      }
    }

    return {
      cookie: sessionCookie(token, this.options.sessionTtlSec, secure, this.options.cookieName),
      jti,
      token,
    }
  }

  /** Revokes the session behind a token (logout). Idempotent. */
  async revokeSession(token: string): Promise<void> {
    const payload = await verifySessionToken(token)
    if (payload?.jti) {
      revokeSessionRow(this.sessions, payload.jti)
      this.logger.info(`Revoked session: jti=${payload.jti}, sub=${payload.sub}`)
    } else {
      this.logger.warn("Revocation requested for untrackable session token")
    }
  }

  /** Revokes every session of a user (admin kill switch). */
  revokeAllSessions(userId: string): void {
    revokeAllSessions(this.sessions, userId)
  }

  /** `Set-Cookie` value that expires the session cookie. */
  expiredSessionCookie(secure: boolean): string {
    return clearSessionCookie(secure, this.options.cookieName)
  }

  /**
   * Sliding-session refresh: when a cookie-carried session is past half its
   * lifetime, re-signs it with a fresh expiry (same `jti`) and returns the
   * new `Set-Cookie` value. Returns null when no refresh is due.
   */
  async maybeRefreshSession(request: Request): Promise<string | null> {
    const cookieToken = readCookie(request, this.options.cookieName)
    if (!cookieToken) return null

    const payload = await verifySessionToken(cookieToken)
    if (!payload || !isSessionValid(this.sessions, payload.jti)) return null

    const age = Date.now() / 1000 - payload.iat
    if (age < this.options.sessionTtlSec / 2) return null

    const token = await refreshSessionToken(payload, this.options.sessionTtlSec)
    extendSession(this.sessions, payload.jti, this.options.sessionTtlSec)
    this.logger.info(
      `Refreshed session: sub=${payload.sub}, jti=${payload.jti}, age=${Math.round(age)}s`
    )
    return sessionCookie(
      token,
      this.options.sessionTtlSec,
      isSecureRequest(request),
      this.options.cookieName
    )
  }

  // ── WebSocket tokens ──────────────────────────────────────────────

  /**
   * Mints a short-lived WS token for an already-authenticated request.
   * WebSocket clients that can't send cookies (cross-origin, other port)
   * exchange their session for one of these, then pass `?token=`.
   */
  async issueWsToken(request: Request): Promise<string | null> {
    const user = await this.authenticate(request)
    if (!user) {
      this.logger.warn("WS token request rejected: authentication failed")
      return null
    }
    const token = await signWsToken(
      {
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        roles: user.roles,
        scopes: user.scopes,
        sub: user.sub,
      },
      this.options.wsTokenTtlSec
    )
    this.logger.info(
      `Issued WS token: sub=${user.sub}, provider=${user.provider}, ttl=${this.options.wsTokenTtlSec}s`
    )
    return token
  }

  /**
   * Verifies a WS handshake token: accepts dedicated WS tokens and regular
   * session tokens (subject to session revocation).
   */
  async verifyWsToken(token: string): Promise<AuthUser | null> {
    const wsPayload = await verifyWsTokenSignature(token)
    if (wsPayload) {
      this.logger.info(
        `Verified WS token: sub=${wsPayload.sub}, provider=${wsPayload.provider}, authMethod=ws`
      )
      return {
        authMethod: "session",
        email: wsPayload.email,
        name: wsPayload.name,
        picture: wsPayload.picture,
        provider: wsPayload.provider,
        roles: wsPayload.roles ?? [],
        scopes: wsPayload.scopes ?? [],
        sub: wsPayload.sub,
      }
    }

    const payload = await verifySessionToken(token)
    if (!payload || !isSessionValid(this.sessions, payload.jti)) {
      this.logger.warn(
        `WS token verification failed: sessioninvalid or expired, jti=${payload?.jti ?? "missing"}`
      )
      return null
    }
    this.logger.info(
      `Verified WS token via session: sub=${payload.sub}, authMethod=session`
    )
    return sessionPayloadToUser(payload)
  }

  // ── Local users ───────────────────────────────────────────────────

  /** Username/password login. Issues a session on success. */
  async loginLocal(name: string, pass: string, secure: boolean): Promise<LocalLoginResult> {
    const user = this.users
      .select(["id", "name", "passHash", "provider", "roles"])
      .where({ name })
      .first()

    if (!user || !(await verifyPassword(pass, user.passHash))) {
      this.logger.warn(`Failed login attempt for user: ${name}`)
      return { message: "Invalid credentials", ok: false }
    }

    const { token, jti, cookie } = await this.issueSession(
      {
        email: user.name,
        name: user.name,
        provider: "local",
        roles: parseScopes(user.roles),
        scopes: [],
        sub: user.id,
      },
      secure
    )

    return {
      cookie,
      jti,
      ok: true,
      token,
      user: {
        authMethod: "session",
        email: user.name,
        name: user.name,
        provider: "local",
        roles: parseScopes(user.roles),
        scopes: [],
        sub: user.id,
      },
    }
  }

  /**
   * Registers a local user. The first user ever becomes `firstUserRole`
   * (admin) and guest registration is locked down afterwards.
   */
  async registerLocal(
    name: string,
    pass: string,
    authenticated: AuthUser | null
  ): Promise<RegisterResult> {
    const isFirstUser = this.users.select(["id"]).count() === 0

    if (!isFirstUser && !this.getAllowGuestRegistration() && !authenticated) {
      return {
        message: "Guest registration is disabled. Please authenticate to create new users.",
        ok: false,
        status: 403,
      }
    }

    if (this.users.select(["id"]).where({ name }).first()) {
      return { message: "Username already exists", ok: false, status: 409 }
    }

    const roles = isFirstUser ? [this.options.firstUserRole] : this.options.defaultRoles
    const created = this.users.insertAndGet({
      externalId: null,
      name,
      passHash: await hashPassword(pass),
      provider: "local",
      roles: roles.join(" "),
    })
    if (!created) return { message: "Failed to create user", ok: false, status: 500 }

    this.logger.info(`New local user registered: ${name}`)

    let message = "User created successfully"
    if (isFirstUser) {
      message +=
        ". This was the first user, guest registration is now disabled (change it in the settings)."
      this.guestRegistrationOverride = false
    }

    return { isFirstUser, message, ok: true, user: created }
  }

  /** Updates a user's roles (space-separated role string). */
  setRoles(userId: string, roles: Role[]): boolean {
    const existing = this.users.select(["id"]).where({ id: userId }).first()
    if (!existing) return false
    this.users.where({ id: userId }).update({ roles: roles.join(" ") })
    return true
  }

  // ── OIDC login ────────────────────────────────────────────────────

  /**
   * Completes an OIDC callback: validates the flow cookies, exchanges the
   * code, upserts the local user record (roles persist across logins) and
   * issues the session cookie. Throws on flow errors.
   */
  async completeOidcLogin(
    providerId: string,
    callbackUrl: URL,
    cookies: OauthLoginCookies,
    secure: boolean
  ): Promise<{
    user: AuthUser
    token: string
    jti: string
    cookie: string
    clearCookies: string[]
  }> {
    this.logger.info(`OIDC callback: provider=${providerId}, callback=${callbackUrl.pathname}${callbackUrl.search}`)

    const { claims, sub } = await this.oidc.completeLogin(providerId, callbackUrl, cookies)
    this.logger.info(`User authenticated via ${providerId}: ${claims.email ?? sub}`)

    // Upsert: keep persisted roles, create OIDC-only users with defaults.
    let row = this.users
      .select(["id", "name", "roles", "provider", "externalId"])
      .where({ externalId: sub, provider: providerId })
      .first()

    if (!row) {
      const created = this.users.insertAndGet({
        externalId: sub,
        name: String(claims.name ?? claims.email ?? sub),
        passHash: await unusablePasswordHash(),
        provider: providerId,
        roles: this.options.defaultRoles.join(" "),
      })
      if (!created) throw new Error("Failed to create user from OIDC claims")
      row = created
      this.logger.info(
        `Created new OIDC user: provider=${providerId}, sub=${sub}, name=${row.name}`
      )
    } else {
      this.logger.info(
        `Linked OIDC account: provider=${providerId}, sub=${sub}, existingUserId=${row.id}`
      )
    }

    const { token, jti, cookie } = await this.issueSession(
      {
        email: (claims.email as string) ?? undefined,
        name: (claims.name as string) ?? row.name,
        picture: (claims.picture as string) ?? undefined,
        provider: providerId,
        roles: parseScopes(row.roles),
        scopes: [],
        sub: row.id,
      },
      secure
    )

    return {
      clearCookies: this.oidc.clearLoginCookies(secure),
      cookie,
      jti,
      token,
      user: {
        authMethod: "session",
        email: (claims.email as string) ?? undefined,
        name: (claims.name as string) ?? row.name,
        picture: (claims.picture as string) ?? undefined,
        provider: providerId,
        roles: parseScopes(row.roles),
        scopes: [],
        sub: row.id,
      },
    }
  }

  // ── API keys ──────────────────────────────────────────────────────

  /** See {@link createApiKey}. */
  createApiKey(input: Parameters<typeof createApiKey>[1]) {
    return createApiKey(this.apiKeys, input)
  }

  /** See {@link revokeApiKey}. */
  revokeApiKey(id: string) {
    return revokeApiKey(this.apiKeys, id)
  }

  // ── Guest registration ────────────────────────────────────────────

  /** Dynamic: prefers an in-memory override, then the callback, then true. */
  getAllowGuestRegistration(): boolean {
    if (this.guestRegistrationOverride !== null) return this.guestRegistrationOverride
    if (this.options.getAllowGuestRegistration) return this.options.getAllowGuestRegistration()
    return true
  }

  setAllowGuestRegistration(enable: boolean): void {
    this.guestRegistrationOverride = enable
    return this.setAllowGuestRegistration(enable)
  }

  localUsersExist(): boolean {
    const exists = !!this.users.select(["id"]).first()
    this.logger.debug(`Local users exist check: exists=${exists}`)
    return exists
  }

  get sessionTtlSec(): number {
    return this.options.sessionTtlSec
  }

  get wsTokenTtlSec(): number {
    return this.options.wsTokenTtlSec
  }

  get cookieName(): string {
    return this.options.cookieName
  }
}
