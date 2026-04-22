import type Logger from "@dockstat/logger"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import Elysia, { type AnySchema } from "elysia"
import type { ElysiaWS } from "elysia/ws"
import type { ApiKeysTable } from "./types"
import { verifyAuthToken } from "./utils/jwt"

export type AuthUser = {
  sub: string
  email?: string
  name?: string
  picture?: string
  authMethod?: "jwt" | "apikey"
  scopes?: string
  iat?: number
  exp?: number
  [key: string]: unknown
}

export interface AuthContext {
  user?: AuthUser
  isAuthenticated: boolean
}

export const getMiddlewareFunctions = (
  baseLogger: Logger,
  apiKeys?: QueryBuilder<ApiKeysTable>
) => {
  const logger = baseLogger.spawn("Middleware")

  /**
   * Validates an API key and returns the associated user ID if valid
   */
  const validateApiKey = async (
    apiKey: string
  ): Promise<{ userId: string; scopes: string } | null> => {
    if (!apiKeys) return null

    try {
      const allKeys = apiKeys
        .select(["id", "userId", "keyHash", "scopes", "expiresAt", "revokedAt"])
        .all()

      for (const keyRecord of allKeys) {
        const isValid = await Bun.password.verify(apiKey, keyRecord.keyHash)
        if (isValid) {
          // Check if key is revoked
          if (keyRecord.revokedAt) {
            logger.warn(`API key ${keyRecord.id} is revoked`)
            return null
          }

          // Check if key is expired
          if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
            logger.warn(`API key ${keyRecord.id} is expired`)
            return null
          }

          // Update lastUsedAt
          apiKeys.update({ id: keyRecord.id, lastUsedAt: new Date() })

          logger.info(`Valid API key found for user ${keyRecord.userId}`)
          return { scopes: keyRecord.scopes, userId: keyRecord.userId }
        }
      }

      return null
    } catch (error) {
      logger.error(`Error validating API key: ${error}`)
      return null
    }
  }

  /**
   * Creates ElysiaJS authentication middleware
   * Validates JWT tokens from Authorization header or cookies
   * Also validates API keys if apiKeys table is provided
   * Attaches user information to request context
   *
   * @example
   * ```typescript
   * const app = new Elysia()
   *   .use(createAuthMiddleware())
   *   .get("/protected", ({ user }) => `Hello ${user?.name}`)
   * ```
   */
  const createAuthMiddleware = () => {
    logger.info("Creating auth middleware")
    return new Elysia({
      name: "auth-middleware",
    }).resolve({ as: "global" }, async ({ cookie, headers, route }) => {
      logger.info(`Checking auth for route ${route}`)

      let token: string | null = null
      let apiKey: string | null = null
      let authMethod: "jwt" | "apikey" | null = null

      // Try to get token from Authorization header first
      const authHeader = headers.authorization as string | undefined
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7)
        authMethod = "jwt"
      } else if (authHeader?.startsWith("Api-Key ")) {
        apiKey = authHeader.slice(8)
        authMethod = "apikey"
      } else {
        logger.warn("No authorization token found!")
      }

      // Also check for X-API-Key header
      if (!apiKey && !token) {
        apiKey = (headers["x-api-key"] as string | undefined) || null
        if (apiKey) {
          authMethod = "apikey"
        }
      }

      // Fall back to cookie if no token in header (for JWT only)
      if (!token && !apiKey) {
        const authTokenCookie = cookie?.auth_token as { value?: string } | undefined
        if (authTokenCookie?.value) {
          token = authTokenCookie.value
          authMethod = "jwt"
        } else {
          logger.warn("No Auth cookie found!")
        }
      }

      // Verify the token if present (JWT)
      let user: AuthUser | undefined
      if (token && authMethod === "jwt") {
        logger.info("Verifying JWT Token")
        const payload = await verifyAuthToken(token)
        if (payload && typeof payload.user === "object" && payload.user !== null) {
          user = payload.user as AuthUser
          user.authMethod = "jwt"
        }
      }

      // Verify API key if present
      if (apiKey && authMethod === "apikey" && !user) {
        logger.info("Verifying API Key")
        const keyValidation = await validateApiKey(apiKey)
        if (keyValidation) {
          user = {
            authMethod: "apikey",
            scopes: keyValidation.scopes,
            sub: keyValidation.userId,
          } as AuthUser
        }
      }

      return {
        isAuthenticated: !!user,
        user,
      }
    })
  }

  /**
   * Creates an authenticated route definition
   * Use this decorator to mark routes that require authentication
   * Automatically rejects unauthenticated requests with a 401 status
   *
   * @example
   * ```typescript
   * const app = new Elysia()
   *   .use(createAuthMiddleware())
   *   .get("/protected", () => "Protected data", authenticated())
   * ```
   */
  const authenticated = (options?: { error?: string; response?: AnySchema }) => {
    const { error = "Authentication required" } = options || {}

    logger.info("Route with Authentication hit!")

    return {
      // biome-ignore lint/suspicious/noExplicitAny: I dont know the correct Elysia typing :(
      beforeHandle: (context: any) => {
        const { isAuthenticated, set } = context
        if (!isAuthenticated) {
          logger.error("Not authenticated")
          set.status = 401
          return { error }
        }
      },
      detail: {
        description: "Requires authentication",
        security: [{ bearerAuth: [] as string[] }],
      },
      ...(options?.response && { response: options.response }),
    }
  }

  /**
   * Type guard to check if user is authenticated
   *
   * @example
   * ```typescript
   * if (isAuthenticatedUser(user)) {
   *   console.log(user.email) // TypeScript knows user is defined
   * }
   * ```
   */
  const isAuthenticatedUser = (user: AuthUser | undefined): user is AuthUser => {
    return user !== undefined && typeof user === "object" && "sub" in user
  }

  /**
   * Helper function to extract and validate user from context
   * Throws an error if user is not authenticated
   *
   * @example
   * ```typescript
   * app.get("/profile", ({ user }) => {
   *   const authenticatedUser = requireAuth({ user, isAuthenticated: !!user })
   *   return { email: authenticatedUser.email }
   * })
   * ```
   */
  const requireAuth = (context: { user?: AuthUser; isAuthenticated: boolean }): AuthUser => {
    if (!context.isAuthenticated || !context.user) {
      throw new Error("Authentication required")
    }
    return context.user
  }

  /**
   * Decorator for route handlers that require authentication
   * Ensures the handler has access to a valid user object
   *
   * @example
   * ```typescript
   * app.get("/profile", withAuth(({ user }) => {
   *   return { email: user.email }
   * }))
   * ```
   */
  const withAuth = <T extends Record<string, unknown>, R>(
    handler: (context: { user: AuthUser } & T) => R
  ): ((context: { user?: AuthUser; isAuthenticated: boolean } & T) => R) => {
    return (context) => {
      const user = requireAuth(context)
      return handler({ ...context, user })
    }
  }

  /**
   * Creates an authenticated route definition that requires API key authentication
   * Use this decorator to mark routes that require API key authentication
   * Automatically rejects requests without valid API keys with a 401 status
   *
   * @example
   * ```typescript
   * const app = new Elysia()
   *   .use(createAuthMiddleware(apiKeysTable))
   *   .get("/api/protected", () => "Protected data", apiKeyAuth())
   * ```
   */
  const apiKeyAuth = (options?: { error?: string; response?: AnySchema }) => {
    const { error = "API key authentication required" } = options || {}

    logger.info("Route with API Key Authentication hit!")

    return {
      // biome-ignore lint/suspicious/noExplicitAny: I dont know the correct Elysia typing :(
      beforeHandle: (context: any) => {
        const { user, isAuthenticated, set } = context
        if (!isAuthenticated || !user || user.authMethod !== "apikey") {
          logger.error("Not authenticated with API key")
          set.status = 401
          return { error }
        }
      },
      detail: {
        description: "Requires API key authentication",
        security: [{ apiKeyAuth: [] as string[] }],
      },
      ...(options?.response && { response: options.response }),
    }
  }

  /**
   * Helper function to check if user is authenticated via API key
   *
   * @example
   * ```typescript
   * if (isApiKeyAuth(user)) {
   *   console.log(`API key user: ${user.sub}, scopes: ${user.scopes}`)
   * }
   * ```
   */
  const isApiKeyAuth = (
    user: AuthUser | undefined
  ): user is AuthUser & { authMethod: "apikey"; scopes: string } => {
    return (
      user !== undefined &&
      typeof user === "object" &&
      "authMethod" in user &&
      user.authMethod === "apikey"
    )
  }

  /**
   * Helper function to check if user is authenticated via JWT
   *
   * @example
   * ```typescript
   * if (isJwtAuth(user)) {
   *   console.log(`JWT user: ${user.name}`)
   * }
   * ```
   */
  const isJwtAuth = (user: AuthUser | undefined): user is AuthUser & { authMethod: "jwt" } => {
    return (
      user !== undefined &&
      typeof user === "object" &&
      "authMethod" in user &&
      user.authMethod === "jwt"
    )
  }

  const verifyWsToken = async (token: string | null): Promise<AuthUser | null> => {
    if (!token) return null

    const payload = await verifyAuthToken(token)
    if (payload && typeof payload.user === "object" && payload.user !== null) {
      return payload.user as AuthUser
    }
    return null
  }

  /**
   * Extracts authenticated user from WebSocket context
   * Returns null if user is not authenticated
   *
   * @example
   * ```typescript
   * app.ws("/ws", {
   *   message: (ws) => {
   *     const user = getWsUser(ws)
   *     if (user) {
   *       ws.send(`Hello ${user.name}`)
   *     }
   *   }
   * })
   * ```
   */
  const getWsUser = (ws: { data: Partial<AuthWsContext> }): AuthUser | null => {
    return ws.data.user || null
  }

  /**
   * Create an authenticated WebSocket handler with custom token extraction
   * Use this when you need custom logic to extract the token from the WebSocket connection
   *
   * @example
   * ```typescript
   * app.ws("/ws", {
   *   ...createAuthenticatedWsHandler({
   *     extractToken: (ws) => {
   *       // Extract token based on your setup
   *       return ws.data.query?.token || null
   *     }
   *   }),
   *   message: (ws, msg) => {
   *     const user = ws.data.user // User is guaranteed to be AuthUser here
   *     ws.send(`Hello ${user.name}`)
   *   }
   * })
   * ```
   */
  const createAuthenticatedWsHandler = (options?: { extractToken?: WsTokenExtractor }) => {
    return {
      message: (ws: ElysiaWS<{ user?: AuthUser }>, _message: unknown) => {
        if (!ws.data.user) {
          ws.send(JSON.stringify({ error: "Not authenticated" }))
          ws.close(1008, "Authentication required")
          return
        }
        // Continue processing message if authenticated
      },
      open: async (ws: ElysiaWS<{ user?: AuthUser; userId?: string }>) => {
        // Extract token using the provided function or default
        let token: string | null = null

        if (options?.extractToken) {
          token = options.extractToken(ws)
        }

        const user = await verifyWsToken(token)
        if (!user) {
          ws.close(1008, "Authentication required")
          return
        }

        ws.data.user = user
        ws.data.userId = user.sub
      },
    }
  }

  const handleWsAuthentication = async (
    ws: ElysiaWS<{ user?: AuthUser; userId?: string }>,
    token: string | null
  ): Promise<boolean> => {
    const user = await verifyWsToken(token)
    if (!user) {
      ws.close(1008, "Authentication required")
      return false
    }

    ws.data.user = user
    ws.data.userId = user.sub
    return true
  }

  return {
    apiKeyAuth,
    authenticated,
    createAuthenticatedWsHandler,
    createAuthMiddleware,
    getWsUser,
    handleWsAuthentication,
    isApiKeyAuth,
    isAuthenticatedUser,
    isJwtAuth,
    validateApiKey,
    withAuth,
  }
}

/**
 * WebSocket context with authentication data
 */
export interface AuthWsContext {
  user?: AuthUser
  userId?: string
  isAuthenticated: boolean
}

/**
 * Type for JWT payload returned by verification
 */
export type JWTPayload = {
  user: AuthUser
  iat?: number
  exp?: number
}

/**
 * Type for WebSocket URL extraction function
 * Implement this function based on your WebSocket connection setup
 * to extract the token from the connection URL
 */
export type WsTokenExtractor = (ws: ElysiaWS) => string | null
