import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import Elysia, { t } from "elysia"
import { SignJWT } from "jose"
import * as client from "openid-client"
import type { ProvidersTable } from "./types"
import { BASE_URL, FRONTEND_URL, JWT_SECRET } from "./utils/env"

export class AuthHandler {
  table: QueryBuilder<ProvidersTable>
  logger: Logger
  issuerCache = new Map<string, client.Configuration>()

  constructor(db: DB, logger: Logger) {
    this.logger = logger.spawn("Auth")

    this.logger.info("Initializing Auth Service")

    this.table = db.createTable<ProvidersTable>(
      "oidc-providers",
      {
        client_id: column.text({notNull: true}),
        client_secret: column.text({notNull: true}),
        created_at: column.createdAt(),
        id: column.uuid({ generateDefault: true }),
        issuer_url: column.text({notNull: true}),
        logout_url: column.text( {notNull: true}),
        scopes: column.text({ default: "openid profile email" }),
      },
      { ifNotExists: true }
    )
  }

  async getConfig(providerId: string) {
    const row = this.table
      .select(["issuer_url", "client_id", "client_secret", "scopes"])
      .where({ id: providerId })
      .first()

    if (!row) throw new Error(`Provider ${providerId} not found!`)

    this.logger.info(`=== OAuth Config for provider ${providerId} ===`)
    this.logger.info(`BASE_URL: ${BASE_URL}`)
    this.logger.info(`FRONTEND_URL: ${FRONTEND_URL}`)
    this.logger.info(`Issuer URL: ${row.issuer_url}`)
    this.logger.info(`Client ID: ${row.client_id}`)
    this.logger.info(`Client Secret: ${row.client_secret ? "[REDACTED]" : "NOT SET"}`)
    this.logger.info(`Scopes: ${row.scopes}`)

    let meta = this.issuerCache.get(row.issuer_url)

    if (!meta) {
      this.logger.info(`Discovering OIDC configuration from issuer...`)
      meta = await client.discovery(new URL(row.issuer_url), row.client_id, row.client_secret)
      this.issuerCache.set(row.issuer_url, meta)
      this.logger.info(
        `OIDC discovery complete. Token endpoint: ${meta.serverMetadata().token_endpoint}`
      )
    } else {
      this.logger.info(`Using cached OIDC configuration`)
    }

    const redirectUri = `${BASE_URL}/${providerId}/callback`
    this.logger.info(`Redirect URI: ${redirectUri}`)

    const config = {
      client_id: row.client_id,
      client_secret: row.client_secret,
      redirect_uris: [redirectUri],
      response_types: ["code"],
    } satisfies client.ClientMetadata

    this.logger.info(`Client config redirect_uris: ${JSON.stringify(config.redirect_uris)}`)
    this.logger.info(`=== End OAuth Config ===`)

    return { config, meta, scopes: row.scopes }
  }

  async getRoutes() {
    return new Elysia({ prefix: "/auth", detail: {tags: ["Auth"]} })
      .post("/providers", ({ body }) => this.table.insertAndGet({...body as object, scopes: (body as {scopes: string}).scopes ? (body as {scopes: string}).scopes : null}), {
        body: t.Object({
          client_id: t.String(),
          client_secret: t.String(),
          issuer_url: t.String(),
          scopes: t.MaybeEmpty(t.String()),
          logout_url: t.MaybeEmpty(t.String())
        })
      })
      .get(
        "/:providerId/login",
        async ({ params: { providerId }, redirect, cookie: { state, nonce, pkce } }) => {
          const { meta, scopes } = await this.getConfig(providerId)

          const stateVal = client.randomState()
          const nonceVal = client.randomNonce()

          const code_verifier = client.randomPKCECodeVerifier()
          const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

          const isSecure = BASE_URL.startsWith("https://")
          this.logger.info(`Setting OAuth cookies for provider ${providerId} (secure: ${isSecure})`)

          state.value = stateVal
          state.httpOnly = true
          state.secure = isSecure
          state.sameSite = "lax"
          state.maxAge = 600

          nonce.value = nonceVal
          nonce.httpOnly = true
          nonce.secure = isSecure
          nonce.sameSite = "lax"
          nonce.maxAge = 600

          pkce.value = code_verifier
          pkce.httpOnly = true
          pkce.secure = isSecure
          pkce.sameSite = "lax"
          pkce.maxAge = 600

          const params: Record<string, string> = {
            code_challenge,
            code_challenge_method: "S256",
            redirect_uri: `${BASE_URL}/${providerId}/callback`,
            scopes,
            nonce: nonceVal,
            state: stateVal,
          }

          const redirectTo: URL = client.buildAuthorizationUrl(meta, params)

          this.logger.info(`=== OAuth Login Flow ===`)
          this.logger.info(`Authorization URL: ${redirectTo.toString()}`)
          this.logger.info(`Params sent: ${JSON.stringify(params)}`)
          this.logger.info(`=== End Login Flow ===\n`)
          return redirect(redirectTo.toString())
        },
        {
          params: t.Object({ providerId: t.String() }),
        }
      )

      .get(
        "/:providerId/callback",
        async ({ params: { providerId }, query, cookie, set }) => {
          const { meta } = await this.getConfig(providerId)
          const { state: returnedState, code } = query

          this.logger.info(`=== OAuth Callback Flow for ${providerId} ===`)
          this.logger.info(`Query params: ${JSON.stringify(query)}`)
          this.logger.info(`Code present: ${!!code}`)
          this.logger.info(`Returned state: ${returnedState}`)

          // Check if OAuth cookies are present (they should have been set by login route)
          if (!cookie.state?.value || !cookie.nonce?.value || !cookie.pkce?.value) {
            this.logger.error(
              `Missing OAuth cookies - login route may have failed ${JSON.stringify({
                allCookies: Object.keys(cookie),
                nonce: cookie.nonce?.value ? "present" : "missing",
                pkce: cookie.pkce?.value ? "present" : "missing",
                state: cookie.state?.value ? "present" : "missing",
              })}`
            )
            set.status = 400
            return "Authentication failed: Missing security cookies. Please try logging in again from the login page."
          }

          this.logger.info(`Cookie state: ${cookie.state.value}`)
          this.logger.info(`Cookie nonce: ${cookie.nonce.value}`)
          this.logger.info(`Cookie pkce: ${String(cookie.pkce.value).substring(0, 20)}...`)

          if (cookie.state.value !== returnedState) {
            this.logger.error(
              `Invalid state parameter in OAuth callback: ${JSON.stringify({
                expected: cookie.state.value,
                received: returnedState,
              })}`
            )
            set.status = 400
            return "Invalid state"
          }

          this.logger.info("State validation passed. Exchanging authorization code for tokens...")

          const callbackUrl = new URL(
            `${BASE_URL}/${providerId}/callback?${new URLSearchParams(query)}`
          )
          this.logger.info(`Callback URL for token exchange: ${callbackUrl.toString()}`)

          // Log detailed token exchange parameters
          const serverMetadata = meta.serverMetadata()
          this.logger.info(`=== Token Exchange Parameters ===`)
          this.logger.info(`Token Endpoint: ${serverMetadata.token_endpoint}`)
          this.logger.info(`Authorization Endpoint: ${serverMetadata.authorization_endpoint}`)
          this.logger.info(`Expected Nonce: ${cookie.nonce.value}`)
          this.logger.info(`Expected State: ${cookie.state.value}`)
          this.logger.info(`PKCE Code Verifier (first 20 chars): ${String(cookie.pkce.value).substring(0, 20)}...`)
          this.logger.info(`Full PKCE Code Verifier: ${String(cookie.pkce.value)}`)
          this.logger.info(`Callback URL (full): ${callbackUrl.toString()}`)
          this.logger.info(`=== End Token Exchange Parameters ===`)

          try {
            const tokens = await client.authorizationCodeGrant(meta, callbackUrl, {
              expectedNonce: String(cookie.nonce.value),
              expectedState: String(cookie.state.value),
              pkceCodeVerifier: String(cookie.pkce.value),
            })
            this.logger.info(`Token exchange successful! Token type: ${tokens.token_type}`)

            const userInfo = await client.fetchUserInfo(meta, tokens.access_token, String(tokens.claims().sub))
            this.logger.info(`Successfully fetched user info for: ${userInfo.email || userInfo.sub}`)

          cookie.state.remove()
          cookie.nonce.remove()
          cookie.pkce.remove()

          // Create a JWT with user info to pass to the frontend
          const secret = JWT_SECRET
          const token = await new SignJWT({ user: userInfo })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("5m")
            .sign(secret)

          // Redirect to frontend callback page with JWT token
          const frontendCallbackUrl = `${FRONTEND_URL}/auth/${providerId}/callback?token=${token}`
          this.logger.info(
            `Redirecting to frontend callback: ${FRONTEND_URL}/auth/${providerId}/callback`
          )

          return new Response(null, {
            headers: {
              Location: frontendCallbackUrl,
            },
            status: 302,
          })
          } catch (error) {
            const errorDetails = {
              error: error instanceof Error ? error.message : String(error),
              name: error instanceof Error ? error.name : undefined,
              stack: error instanceof Error ? error.stack : undefined,
              constructor: error?.constructor?.name,
            }

            this.logger.error(`Token exchange failed! ${JSON.stringify(errorDetails, null, 2)}`)
            set.status = 500
            return `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        },
        {
          params: t.Object({ providerId: t.String() }),
          query: t.Object({ code: t.String(), state: t.String() }),
        }
      )

      .get("/providers", () =>
        this.table.select(["id", "issuer_url", "scopes", "client_id", "created_at"]).all()
    )

      .get("/providers", () => this.table.select(["id", "issuer_url", "scopes", "client_id", "created_at"]).all())

      .get("/:providerId/logout", async ({params: {providerId}, query, redirect}) => {
        const { meta } = await this.getConfig(providerId)
        const {logout_url: logoutUrl} = this.table.select(["logout_url"]).where({id: providerId}).first()

        this.logger.info(`Logging out from ${providerId}; redirect after: ${query.redirectUri}`)

        let redirectTo = client.buildEndSessionUrl(meta,{post_logout_redirect_uri: query.redirectUri })

        if(logoutUrl !== null){
          redirectTo = new URL(logoutUrl)
        }

        this.logger.info(`End Session URL: ${redirectTo.toString()}`)

        return redirect(redirectTo.toString())
      }, {
        params: t.Object({ providerId: t.String() }),
        query: t.Object({redirectUri: t.String()})
      })
  }
}
