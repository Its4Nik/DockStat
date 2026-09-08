import type Logger from "@dockstat/logger"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import { CryptrAsync } from "cryptr"
import * as client from "openid-client"
import { CRYPTO_SECRET } from "./env"
import type { ProvidersTable } from "./types"

/**
 * OIDC authorization-code flow with PKCE, state and nonce — the security
 * values travel in short-lived HttpOnly cookies between the redirect legs.
 */

const crypt = new CryptrAsync(CRYPTO_SECRET)

const OAUTH_COOKIE_MAX_AGE = 600 // 10 minutes

export interface OauthLoginCookies {
  state: string
  nonce: string
  pkce: string
}

export interface BeginLoginResult {
  /** Provider authorization URL to redirect to. */
  url: URL
  /** `Set-Cookie` header values to attach to the redirect response. */
  cookies: string[]
}

export interface ProviderInput {
  client_id: string
  client_secret: string
  issuer_url: string
  name?: string
  icon?: string
  scopes?: string
  logout_url?: string | null
}

export class OidcService {
  private readonly providers: QueryBuilder<ProvidersTable>
  private readonly logger: Logger
  private readonly issuerCache = new Map<string, client.Configuration>()

  constructor(providers: QueryBuilder<ProvidersTable>, baseLogger: Logger) {
    this.providers = providers
    this.logger = baseLogger.spawn("Oidc")
  }

  /** Raw provider row or null. */
  getProvider(providerId: string): ProvidersTable | null {
    return this.providers.select(["*"]).where({ id: providerId }).first() ?? null
  }

  listProviders() {
    return this.providers
      .select(["id", "issuer_url", "scopes", "client_id", "created_at", "name", "icon"])
      .all()
  }

  async createProvider(input: ProviderInput): Promise<ProvidersTable> {
    const created = await this.providers.insertAndGet({
      client_id: input.client_id,
      client_secret: await crypt.encrypt(input.client_secret),
      icon: input.icon || null,
      issuer_url: input.issuer_url,
      logout_url: input.logout_url || null,
      name: input.name || null,
      scopes: input.scopes || "openid profile email",
    })
    if (!created) throw new Error("Failed to create provider")
    return created
  }

  deleteProvider(providerId: string): boolean {
    const existing = this.getProvider(providerId)
    if (!existing) return false
    this.providers.where({ id: providerId }).delete()
    return true
  }

  /** Discovers (and caches) the provider's OIDC metadata. */
  private async configuration(row: ProvidersTable): Promise<client.Configuration> {
    const cached = this.issuerCache.get(row.issuer_url)
    if (cached) return cached

    const clientSecret = await crypt.decrypt(row.client_secret)
    const config = await client.discovery(new URL(row.issuer_url), row.client_id, clientSecret)
    this.issuerCache.set(row.issuer_url, config)
    return config
  }

  private async configFor(providerId: string) {
    const row = this.getProvider(providerId)
    if (!row) throw new Error(`Provider ${providerId} not found`)
    return { meta: await this.configuration(row), row }
  }

  private oauthCookie(name: string, value: string, secure: boolean): string {
    return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Max-Age=${OAUTH_COOKIE_MAX_AGE}`
  }

  /**
   * Starts the flow: builds the authorization URL and the state/nonce/pkce
   * cookies that anchor the callback validation.
   */
  async beginLogin(
    providerId: string,
    redirectUri: string,
    secure: boolean
  ): Promise<BeginLoginResult> {
    const { meta, row } = await this.configFor(providerId)

    const state = client.randomState()
    const nonce = client.randomNonce()
    const codeVerifier = client.randomPKCECodeVerifier()
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)

    const url = client.buildAuthorizationUrl(meta, {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce,
      redirect_uri: redirectUri,
      scopes: row.scopes,
      state,
    })

    this.logger.debug(`OAuth login flow started for provider ${providerId}`)
    return {
      cookies: [
        this.oauthCookie("state", state, secure),
        this.oauthCookie("nonce", nonce, secure),
        this.oauthCookie("pkce", codeVerifier, secure),
      ],
      url,
    }
  }

  /**
   * Finishes the flow: validates state, exchanges the code (PKCE + nonce
   * enforced by openid-client) and fetches the userinfo claims.
   */
  async completeLogin(
    providerId: string,
    callbackUrl: URL,
    cookies: OauthLoginCookies
  ): Promise<{ claims: Record<string, unknown>; sub: string }> {
    const { meta } = await this.configFor(providerId)

    if (cookies.state !== callbackUrl.searchParams.get("state")) {
      throw new Error("Invalid state")
    }

    const tokens = await client.authorizationCodeGrant(meta, callbackUrl, {
      expectedNonce: cookies.nonce,
      expectedState: cookies.state,
      pkceCodeVerifier: cookies.pkce,
    })
    if (!tokens) throw new Error("No tokens returned from provider")

    const sub = String((tokens.claims?.() ?? { sub: "" }).sub)
    const claims = (await client.fetchUserInfo(meta, tokens.access_token ?? "", sub)) as Record<
      string,
      unknown
    >

    return { claims, sub: String(claims.sub ?? sub) }
  }

  /** Expired-oauth-cookie `Set-Cookie` values for the callback response. */
  clearLoginCookies(secure: boolean): string[] {
    return ["state", "nonce", "pkce"].map(
      (name) => `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`
    )
  }

  /** Provider end-session URL (falls back to the configured logout_url). */
  async endSessionUrl(providerId: string, postLogoutUri: string): Promise<URL> {
    const { meta, row } = await this.configFor(providerId)
    if (row.logout_url) return new URL(row.logout_url)
    return client.buildEndSessionUrl(meta, { post_logout_redirect_uri: postLogoutUri })
  }
}
