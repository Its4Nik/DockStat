import type Logger from "@dockstat/logger"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import { error, DockStatErrorCode } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import * as client from "openid-client"
import type { ConfigService } from "./config"
import type { AuthContext } from "./middleware"
import type { ApiKeysTable, LocalUsersTable, ProvidersTable } from "./types"
import crypt from "./utils/encrypt"
import { BASE_URL, FRONTEND_URL } from "./utils/env"
import { createAuthToken, verifyAuthToken } from "./utils/jwt"

export function createAuthRoutes(
  table: QueryBuilder<ProvidersTable>,
  users: QueryBuilder<LocalUsersTable>,
  apiKeys: QueryBuilder<ApiKeysTable>,
  logger: Logger,
  configService: ConfigService,
  getAllowGuestRegistration: () => boolean,
  setAllowGuestRegistration: (enable: boolean) => void,
  requireAuth: () => Record<string, unknown>
) {
  /** Convert Unix timestamp (seconds) fields to ISO 8601 strings for JSON response */
  const serializeDates = <T extends Record<string, unknown>>(
    row: T,
    dateFields: (keyof T)[]
  ): T => {
    const result = { ...row }
    for (const field of dateFields) {
      const value = result[field]
      if (value !== null && value !== undefined && typeof value === "number") {
        // Unix timestamp in seconds → ISO string
        ;(result as Record<string, unknown>)[field as string] = new Date(value * 1000).toISOString()
      }
    }
    return result
  }

  return new Elysia({ detail: { tags: ["Auth"] }, prefix: "/auth" })
    .post(
      "/providers",
      async ({ body }) => {
        const requestBody = body as {
          client_id: string
          client_secret: string
          icon: string | undefined
          issuer_url: string
          logout_url: string | null
          name: string | undefined
          scopes: string | null
        }
        return table.insertAndGet({
          client_id: requestBody.client_id,
          client_secret: await crypt.encrypt(requestBody.client_secret),
          icon: requestBody.icon || null,
          issuer_url: requestBody.issuer_url,
          logout_url: requestBody.logout_url || null,
          name: requestBody.name || null,
          scopes: requestBody.scopes || null,
        })
      },
      {
        ...requireAuth(),
        body: t.Object({
          client_id: t.String(),
          client_secret: t.String(),
          icon: t.Optional(t.String()),
          issuer_url: t.String(),
          logout_url: t.MaybeEmpty(t.String()),
          name: t.Optional(t.String()),
          scopes: t.MaybeEmpty(t.String()),
        }),
        detail: {
          description: "Create a new OAuth/OIDC provider",
          summary: "Create Provider",
        },
      }
    )
    .delete(
      "/providers/:providerId",
      async ({ params: { providerId }, set }) => {
        try {
          const existing = table.where({ id: providerId }).first()
          if (!existing) {
            throw new error.DockStatError({
              code: DockStatErrorCode.NOT_FOUND,
              description: "Provider not found",
              status: 404,
            })
          }

          table.where({ id: providerId }).delete()
          logger.info(`Deleted provider ${providerId}`)
          return { message: "Provider deleted", success: true }
        } catch (err) {
          if (error.isDockStatError(err)) throw err
          logger.error(`Failed to delete provider ${providerId}: ${err}`)
          throw new error.DockStatError({
            code: DockStatErrorCode.INTERNAL,
            description: "Failed to delete provider",
            status: 500,
          })
        }
      },
      {
        ...requireAuth(),
        detail: {
          description: "Delete an OAuth/OIDC provider",
          summary: "Delete Provider",
        },
        params: t.Object({
          providerId: t.String(),
        }),
      }
    )
    .get(
      "/providers",
      () =>
        table
          .select(["id", "issuer_url", "scopes", "client_id", "created_at", "name", "icon"])
          .all()
          .map((p) => serializeDates(p, ["created_at"])),
      {
        detail: {
          description: "Lists all Providers",
          summary: "All Providers",
        },
      }
    )
    .get(
      "/:providerId/login",
      async ({ params: { providerId }, redirect, cookie: { state, nonce, pkce } }) => {
        logger.info(`Logging in via ${providerId}`)
        const { meta, scopes } = await configService.getConfig(providerId)

        const stateVal = client.randomState()
        const nonceVal = client.randomNonce()

        const code_verifier = client.randomPKCECodeVerifier()
        const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

        const isSecure = BASE_URL.startsWith("https://")
        logger.info(`Setting OAuth cookies for provider ${providerId} (secure: ${isSecure})`)

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
          nonce: nonceVal,
          redirect_uri: `${BASE_URL}/${providerId}/callback`,
          scopes,
          state: stateVal,
        }

        const redirectTo: URL = client.buildAuthorizationUrl(meta, params)

        logger.debug(`OAuth login flow started for provider: ${providerId}`)
        return redirect(redirectTo.toString())
      },
      {
        detail: {
          description: "Login using the autogenerated ID (from the DB) of the Provider",
          summary: "Login",
        },
        params: t.Object({ providerId: t.String() }),
      }
    )
    .get(
      "/:providerId/callback",
      async ({ params: { providerId }, query, cookie, set, redirect }) => {
        const { meta } = await configService.getConfig(providerId)
        const { state: returnedState } = query

        logger.debug(`OAuth callback flow started for provider: ${providerId}`)

        // Check if OAuth cookies are present (they should have been set by login route)
        if (!cookie.state?.value || !cookie.nonce?.value || !cookie.pkce?.value) {
          logger.error(
            `Missing OAuth cookies - login route may have failed ${JSON.stringify({
              allCookies: Object.keys(cookie),
              nonce: cookie.nonce?.value ? "present" : "missing",
              pkce: cookie.pkce?.value ? "present" : "missing",
              state: cookie.state?.value ? "present" : "missing",
            })}`
          )
          throw new error.DockStatError({
            code: DockStatErrorCode.BAD_REQUEST,
            description: "Authentication failed: Missing security cookies. Please try logging in again from the login page.",
            status: 400,
          })
        }

        logger.debug(`OAuth cookies validated for provider: ${providerId}`)

        if (cookie.state.value !== returnedState) {
          logger.error(`Invalid state parameter in OAuth callback for provider: ${providerId}`)
          throw new error.DockStatError({
            code: DockStatErrorCode.BAD_REQUEST,
            description: "Invalid state parameter in OAuth callback",
            status: 400,
          })
        }

        logger.debug(
          `State validation passed, exchanging authorization code for provider: ${providerId}`
        )

        const callbackUrl = new URL(
          `${BASE_URL}/${providerId}/callback?${new URLSearchParams(query)}`
        )

        try {
          const tokens = await client.authorizationCodeGrant(meta, callbackUrl, {
            expectedNonce: String(cookie.nonce.value),
            expectedState: String(cookie.state.value),
            pkceCodeVerifier: String(cookie.pkce.value),
          })
          logger.debug(`Token exchange successful for provider: ${providerId}`)

          const userInfo = await client.fetchUserInfo(
            meta,
            tokens.access_token,
            String(tokens.claims().sub)
          )
          logger.info(`User authenticated via ${providerId}: ${userInfo.email || userInfo.sub}`)

          cookie.state.remove()
          cookie.nonce.remove()
          cookie.pkce.remove()

          const token = await createAuthToken(userInfo)

          const isSecure = BASE_URL.startsWith("https://")
          cookie.auth_token.value = token
          cookie.auth_token.httpOnly = false
          cookie.auth_token.path = "/"
          cookie.auth_token.secure = isSecure
          cookie.auth_token.sameSite = "lax"
          cookie.auth_token.maxAge = 86400

          const frontendCallbackUrl = `${FRONTEND_URL}/auth/${providerId}/callback`
          logger.debug(`Redirecting to frontend callback for provider: ${providerId}`)

          return redirect(frontendCallbackUrl)
        } catch (err) {
          if (error.isDockStatError(err)) throw err
          const errorDetails = {
            constructor: err?.constructor?.name,
            error: err instanceof Error ? err.message : String(err),
            name: err instanceof Error ? err.name : undefined,
            stack: err instanceof Error ? err.stack : undefined,
          }

          logger.error(`Token exchange failed! ${JSON.stringify(errorDetails, null, 2)}`)
          throw new error.DockStatError({
            code: DockStatErrorCode.AUTH,
            description: err instanceof Error ? err.message : "Authentication failed",
            status: 500,
          })
        }
      },
      {
        detail: {
          description: "Sets the cookie values and redirects to the frontend",
          summary: "Callback",
        },
        params: t.Object({ providerId: t.String() }),
        query: t.Object({ code: t.String(), state: t.String() }),
      }
    )
    .get(
      "/:providerId/logout",
      async ({ params: { providerId }, query, redirect }) => {
        const { meta } = await configService.getConfig(providerId)
        const { logout_url: logoutUrl } = table
          .select(["logout_url"])
          .where({ id: providerId })
          .first()

        logger.info(`Logging out from ${providerId}; redirect after: ${query.redirectUri}`)

        let redirectTo = client.buildEndSessionUrl(meta, {
          post_logout_redirect_uri: query.redirectUri,
        })

        if (logoutUrl !== null) {
          redirectTo = new URL(logoutUrl)
        }

        logger.info(`End Session URL: ${redirectTo.toString()}`)

        return redirect(redirectTo.toString())
      },
      {
        detail: {
          description:
            "Logout of the Provider which matches the Provider ID from the DB. If a logout_url is defined for the Provider it will use that, otherwise build it from the OIDC-Metadata of the provider",
          summary: "Logout",
        },
        params: t.Object({ providerId: t.String() }),
        query: t.Object({ redirectUri: t.String() }),
      }
    )
    .get(
      "/verify",
      async ({ cookie, headers }) => {
        let token: string | null = null
        const authHeader = headers.authorization as string | undefined
        if (authHeader?.startsWith("Bearer ")) {
          token = authHeader.slice(7)
        }
        if (!token) {
          token = String(cookie.auth_token?.value) ?? null
        }

        if (!token) {
          throw new error.DockStatError({
            code: DockStatErrorCode.UNAUTHORIZED,
            description: "No token provided",
            status: 401,
          })
        }

        const payload = await verifyAuthToken(token)

        if (!payload || typeof payload.user !== "object" || payload.user === null) {
          throw new error.DockStatError({
            code: DockStatErrorCode.UNAUTHORIZED,
            description: "Invalid or expired token",
            status: 401,
          })
        }

        return { user: payload.user }
      },
      {
        detail: {
          description: "Verify the auth_token cookie and return the user info",
          summary: "Verify Token",
        },
      }
    )
    .group("/local", (app) =>
      app
        .post(
          "/register",
          async (context) => {
            const { body } = context
            try {
              const requestBody = body as { name: string; pass: string }

              const allowGuests = getAllowGuestRegistration()
              const existingUser = users.select(["id"]).where({ name: requestBody.name }).first()
              const isInitialUser = users.select(["id"]).count() === 0

              if (existingUser) {
                throw new error.DockStatError({
                  code: DockStatErrorCode.CONFLICT,
                  description: "Username already exists",
                  status: 409,
                })
              }

              if (!allowGuests && !(context as unknown as AuthContext).isAuthenticated) {
                throw new error.DockStatError({
                  code: DockStatErrorCode.FORBIDDEN,
                  description: "Guest registration is disabled. Please authenticate to create new users.",
                  status: 403,
                })
              }

              const passHash = await Bun.password.hash(requestBody.pass, {
                algorithm: "argon2id",
                memoryCost: 65536,
                timeCost: 4,
              })

              const user = users.insertAndGet({
                name: requestBody.name,
                passHash,
              })

              logger.info(`New local user registered: ${requestBody.name}`)

              let msg: undefined | string

              if (isInitialUser) {
                msg =
                  "This was the first user that has been created, restricting local registration of users to already registered users. You can change this inside the DockStat settings under additional settings."
                logger.warn(msg)
                setAllowGuestRegistration(false)
              }

              return {
                msg,
                success: true,
                user: { id: user.id, name: user.name },
              }
            } catch (err) {
              if (error.isDockStatError(err)) throw err
              const requestBody = body as { name: string; pass: string }
              logger.error(`Registration failed for ${requestBody.name}: ${err}`)
              throw new error.DockStatError({
                code: DockStatErrorCode.INTERNAL,
                description: "Registration failed",
                status: 500,
              })
            }
          },
          {
            body: t.Object({
              name: t.String({ maxLength: 50, minLength: 3 }),
              pass: t.String({ minLength: 8 }),
            }),
            detail: {
              description: "Register a new local user",
              summary: "Register",
            },
          }
        )
        .post(
          "/login",
          async ({ body }) => {
            try {
              const requestBody = body as { name: string; pass: string }
              const user = users
                .select(["id", "name", "passHash"])
                .where({ name: requestBody.name })
                .first()

              if (!user) {
                logger.warn(`Login attempt for non-existent user: ${requestBody.name}`)
                throw new error.DockStatError({
                  code: DockStatErrorCode.UNAUTHORIZED,
                  description: "Invalid credentials",
                  status: 401,
                })
              }

              const isValid = await Bun.password.verify(requestBody.pass, user.passHash)

              if (!isValid) {
                logger.warn(`Failed login attempt for user: ${requestBody.name}`)
                throw new error.DockStatError({
                  code: DockStatErrorCode.UNAUTHORIZED,
                  description: "Invalid credentials",
                  status: 401,
                })
              }

              logger.info(`Successful login for local user: ${requestBody.name}`)

              const token = await createAuthToken({
                email: user.name,
                name: user.name,
                provider: "local",
                sub: user.id,
              })

              return {
                success: true,
                token,
              }
            } catch (err) {
              if (error.isDockStatError(err)) throw err
              const requestBody = body as { name: string; pass: string }
              logger.error(`Login failed for ${requestBody.name}: ${err}`)
              throw new error.DockStatError({
                code: DockStatErrorCode.INTERNAL,
                description: "Login failed",
                status: 500,
              })
            }
          },
          {
            body: t.Object({
              name: t.String(),
              pass: t.String(),
            }),
            detail: {
              description: "Authenticate with username and password",
              summary: "Login",
            },
          }
        )
        .get(
          "/login",
          async ({ redirect }) => {
            const loginUrl = `${FRONTEND_URL}/auth/local/login`
            logger.info(`Redirecting to local login page: ${loginUrl}`)
            return redirect(loginUrl)
          },
          {
            detail: {
              description: "Redirect to frontend login page",
              summary: "Login Page",
            },
          }
        )
        .get(
          "/logout",
          async ({ query, redirect }) => {
            const redirectUri = query.redirectUri || FRONTEND_URL
            logger.info(`Local user logout, redirecting to: ${redirectUri}`)
            return redirect(redirectUri)
          },
          {
            detail: {
              description: "Logout local user and redirect",
              summary: "Logout",
            },
            query: t.Object({
              redirectUri: t.Optional(t.String()),
            }),
          }
        )
        .get("/exists", async () => {
          try {
            const user = users.select(["id"]).first()
            const exists = !!user
            logger.info(`Local user exists check: ${exists}`)
            return { exists }
          } catch (error) {
            logger.error(`Error checking if local user exists: ${error}`)
            return { exists: false }
          }
        })
        .get("/allow-guest", () => getAllowGuestRegistration())
    )
    .get(
      "/users",
      async () => {
        try {
          const userList = users
            .select(["id", "name", "createdAt", "updatedAt"])
            .all()
            .map((u) => serializeDates(u, ["createdAt", "updatedAt"]))
          return { users: userList }
        } catch (error) {
          logger.error(`Failed to list users: ${error}`)
          return { users: [] }
        }
      },
      {
        ...requireAuth(),
        detail: {
          description: "List all local users",
          summary: "List Users",
        },
      }
    )
    .delete(
      "/users/:userId",
      async ({ params: { userId } }) => {
        try {
          const existing = users.where({ id: userId }).first()
          if (!existing) {
            throw new error.DockStatError({
              code: DockStatErrorCode.NOT_FOUND,
              description: "User not found",
              status: 404,
            })
          }

          users.where({ id: userId }).delete()
          logger.info(`Deleted user ${userId}`)
          return { message: "User deleted", success: true }
        } catch (err) {
          if (error.isDockStatError(err)) throw err
          logger.error(`Failed to delete user ${userId}: ${err}`)
          throw new error.DockStatError({
            code: DockStatErrorCode.INTERNAL,
            description: "Failed to delete user",
            status: 500,
          })
        }
      },
      {
        ...requireAuth(),
        detail: {
          description: "Delete a local user",
          summary: "Delete User",
        },
        params: t.Object({
          userId: t.String(),
        }),
      }
    )
    .group("/guest", (app) =>
      app
        .get("/", () => getAllowGuestRegistration())
        .post(
          "/:action",
          async ({ params }) => {
            const action = params.action as "enable" | "disable"

            if (action === "enable") {
              setAllowGuestRegistration(true)
              logger.info("Guest registration enabled")
              return { message: "Guest registration enabled", success: true }
            } else if (action === "disable") {
              setAllowGuestRegistration(false)
              logger.info("Guest registration disabled")
              return { message: "Guest registration disabled", success: true }
            } else {
              throw new error.DockStatError({
                code: DockStatErrorCode.BAD_REQUEST,
                description: "Invalid action. Use 'enable' or 'disable'",
                status: 400,
              })
            }
          },
          {
            detail: {
              description: "Enable or disable guest registration",
              summary: "Toggle Guest Registration",
            },
            params: t.Object({
              action: t.Union([t.Literal("enable"), t.Literal("disable")]),
            }),
          }
        )
    )
    .group("/api-keys", (app) =>
      app
        .post(
          "/",
          async ({ body }) => {
            try {
              const requestBody = body as {
                userId: string
                name: string
                scopes?: string
                expiresAt?: string
              }

              const apiKey = `dockstat_${crypto.randomUUID().replace(/-/g, "")}`

              const keyHash = await Bun.password.hash(apiKey, {
                algorithm: "argon2id",
                memoryCost: 65536,
                timeCost: 3,
              })

              const apiKeyRecord = apiKeys.insertAndGet({
                expiresAt: requestBody.expiresAt ? new Date(requestBody.expiresAt) : null,
                keyHash,
                lastUsedAt: null,
                name: requestBody.name,
                revokedAt: null,
                scopes: requestBody.scopes || "*",
                userId: requestBody.userId,
              })

              logger.info(`API key created for user ${requestBody.userId}: ${apiKeyRecord.id}`)

              return {
                apiKey: serializeDates(
                  {
                    expiresAt: apiKeyRecord.expiresAt,
                    id: apiKeyRecord.id,
                    key: apiKey,
                    name: apiKeyRecord.name,
                    scopes: apiKeyRecord.scopes,
                  },
                  ["expiresAt"]
                ),
                success: true,
              }
            } catch (err) {
              if (error.isDockStatError(err)) throw err
              logger.error(`Failed to create API key: ${err}`)
              throw new error.DockStatError({
                code: DockStatErrorCode.INTERNAL,
                description: "Failed to create API key",
                status: 500,
              })
            }
          },
          {
            body: t.Object({
              expiresAt: t.Optional(t.String()),
              name: t.String({ maxLength: 100, minLength: 1 }),
              scopes: t.Optional(t.String()),
              userId: t.String(),
            }),
            detail: {
              description: "Generate a new API key for a user",
              summary: "Create API Key",
            },
          }
        )
        .get(
          "/",
          async ({ query }) => {
            try {
              const queryParams = query as { userId?: string }

              const keys = queryParams.userId
                ? apiKeys
                    .select([
                      "id",
                      "name",
                      "scopes",
                      "expiresAt",
                      "lastUsedAt",
                      "createdAt",
                      "revokedAt",
                    ])
                    .where({ userId: queryParams.userId })
                    .all()
                    .map((k) =>
                      serializeDates(k, ["createdAt", "expiresAt", "lastUsedAt", "revokedAt"])
                    )
                : apiKeys
                    .select([
                      "id",
                      "name",
                      "scopes",
                      "expiresAt",
                      "lastUsedAt",
                      "createdAt",
                      "revokedAt",
                    ])
                    .all()
                    .map((k) =>
                      serializeDates(k, ["createdAt", "expiresAt", "lastUsedAt", "revokedAt"])
                    )

              return { keys }
            } catch (error) {
              logger.error(`Failed to list API keys: ${error}`)
              return { keys: [] }
            }
          },
          {
            detail: {
              description: "List all API keys (optionally filtered by user)",
              summary: "List API Keys",
            },
            query: t.Object({
              userId: t.Optional(t.String()),
            }),
          }
        )
        .get(
          "/:id",
          async ({ params: { id } }) => {
            try {
              const apiKey = apiKeys
                .select([
                  "id",
                  "name",
                  "scopes",
                  "expiresAt",
                  "lastUsedAt",
                  "createdAt",
                  "revokedAt",
                ])
                .where({ id })
                .first()

              if (!apiKey) {
                throw new error.DockStatError({
                  code: DockStatErrorCode.NOT_FOUND,
                  description: "API key not found",
                  status: 404,
                })
              }

              return { apiKey }
            } catch (err) {
              if (error.isDockStatError(err)) throw err
              logger.error(`Failed to get API key ${id}: ${err}`)
              throw new error.DockStatError({
                code: DockStatErrorCode.INTERNAL,
                description: "Failed to get API key",
                status: 500,
              })
            }
          },
          {
            detail: {
              description: "Get a specific API key details (excludes the actual key)",
              summary: "Get API Key",
            },
            params: t.Object({ id: t.String() }),
          }
        )
        .delete(
          "/:id",
          async ({ params: { id } }) => {
            try {
              const apiKey = apiKeys.select(["id", "revokedAt"]).where({ id }).first()

              if (!apiKey) {
                throw new error.DockStatError({
                  code: DockStatErrorCode.NOT_FOUND,
                  description: "API key not found",
                  status: 404,
                })
              }

              if (apiKey.revokedAt) {
                throw new error.DockStatError({
                  code: DockStatErrorCode.BAD_REQUEST,
                  description: "API key is already revoked",
                  status: 400,
                })
              }

              apiKeys.where({ id }).update({ revokedAt: new Date() })

              logger.info(`API key revoked: ${id}`)

              return { message: "API key revoked successfully", success: true }
            } catch (err) {
              if (error.isDockStatError(err)) throw err
              logger.error(`Failed to revoke API key ${id}: ${err}`)
              throw new error.DockStatError({
                code: DockStatErrorCode.INTERNAL,
                description: "Failed to revoke API key",
                status: 500,
              })
            }
          },
          {
            detail: {
              description: "Revoke an API key",
              summary: "Revoke API Key",
            },
            params: t.Object({ id: t.String() }),
          }
        )
    )
}
