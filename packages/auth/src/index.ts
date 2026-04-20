import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import Elysia, { t } from "elysia"
import * as client from "openid-client"
import type { ProvidersTable } from "./types"
import { BASE_URL } from "./utils/env"

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
        client_id: column.text(),
        client_secret: column.text(),
        created_at: column.createdAt(),
        id: column.uuid({generateDefault: true}),
        issuer_url: column.text(),
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

    let meta = this.issuerCache.get(row.issuer_url)

    if (!meta) {
      meta = await client.discovery(new URL(row.issuer_url), row.client_id, row.client_secret)
      this.issuerCache.set(row.issuer_url, meta)
    }

    const config = {
      client_id: row.issuer_url,
      client_secret: row.client_secret,
      redirect_uris: [`${BASE_URL}/${providerId}/callback`],
      response_types: ["code"],
    } satisfies client.ClientMetadata

    return { config, meta, scopes: row.scopes }
  }

  async getRoutes() {
    return new Elysia({ prefix: "/auth" })
      .get(
        "/:providerId/login",
        async ({ params: { providerId }, set, redirect, cookie }) => {
          const { meta, scopes } = await this.getConfig(providerId)

          const state = client.randomState()
          const nonce = client.randomNonce()

          const code_verifier = client.randomPKCECodeVerifier()
          const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

          cookie.state.value = state
          cookie.state.httpOnly = true
          cookie.state.secure = true
          cookie.state.sameSite = "lax"
          cookie.state.maxAge = 600

          cookie.nonce.value = nonce
          cookie.nonce.httpOnly = true
          cookie.nonce.secure = true
          cookie.nonce.sameSite = "lax"
          cookie.nonce.maxAge = 600

          cookie.pkce.value = code_verifier
          cookie.pkce.httpOnly = true
          cookie.pkce.secure = true
          cookie.pkce.sameSite = "lax"
          cookie.pkce.maxAge = 600

          const params: Record<string, string> = {
            code_challenge,
            code_challenge_method: "S256",
            redirect_uri: `${BASE_URL}/${providerId}/callback`,
            scopes,
          }

          if (meta.serverMetadata().supportsPKCE()) {
            params.state = state
          }

          const redirectTo: URL = client.buildAuthorizationUrl(meta, params)

          return redirect(redirectTo.toString())
        },
        {
          cookie: t.Cookie({
            nonce: t.String(),
            pkce: t.String(),
            state: t.String(),
          }),
          params: t.Object({ providerId: t.String() }),
        }
      )

      .get(
        "/:providerId/callback",
        async ({ params: { providerId }, query, cookie, set }) => {
          const {  meta } = await this.getConfig(providerId)
          const {  state: returnedState } = query

          if (!cookie.state.value || cookie.state.value !== returnedState) {
            set.status = 400
            return "Invalid state"
          }

          const tokens = await client.authorizationCodeGrant(
            meta,
            new URL(`${BASE_URL}/auth/${providerId}/callback?${new URLSearchParams(query)}`),
            {
              expectedNonce: cookie.nonce.value,
              expectedState: cookie.state.value,
              pkceCodeVerifier: cookie.pkce.value,
            }
          )


          const userInfo = await  client.fetchUserInfo(meta,tokens.access_token, String(tokens.claims()?.sub))

          cookie.state.remove();
          cookie.nonce.remove();
          cookie.pkce.remove();

          return { user: userInfo };
        },
        {
          cookie: t.Cookie({
            nonce: t.String(),
            pkce: t.String(),
            state: t.String(),
          }),
          params: t.Object({ providerId: t.String() }),
          query: t.Object({ code: t.String(), state: t.String() }),
        }
      )


      .get("/providers", () => this.table.select(["id", "issuer_url", "scopes", "client_id", "created_at"]).all())
      .post("/providers", ({body}) => this.table.insertAndGet({...body, scopes: body.scopes ? body.scopes : undefined}), {
        body: t.Object({
          client_id: t.String(),
          client_secret: t.String(),
          issuer_url: t.String(),
          scopes: t.MaybeEmpty(t.String())
      })})
  }
}
