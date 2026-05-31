import type Logger from "@dockstat/logger"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import Elysia, { type AnySchema } from "elysia"
import type { ElysiaWS } from "elysia/ws"
import type { ApiKeysTable } from "./types"
import { verifyAuthToken } from "./utils/jwt"

/**
 * Structured error body matching DockStatErrorBody from @dockstat/utils.
 * Defined inline to avoid coupling @dockstat/auth to @dockstat/utils.
 * The API's global onError handler will respect this shape.
 */
interface AuthErrorBody {
  code: string
  description: string
  path?: string
  reqId?: string
  status: number
  timestamp: string
}

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
  getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>,
  apiKeys?: QueryBuilder<ApiKeysTable>
) => {
  const logger = baseLogger.spawn("Middleware")

  /**
   * Validates an API key and returns the associated user ID if valid
   */
  const validateApiKey = async (
    apiKey: string,
    request: Request
  ): Promise<{ userId: string; scopes: string } | null> => {
    if (!apiKeys) return null

    const reqId = getStateMap().get(request).reqId

    try {
      const allKeys = apiKeys
        .select(["id", "userId", "keyHash", "scopes", "expiresAt", "revokedAt"])
        .all()

      for (const keyRecord of allKeys) {
        const isValid = await Bun.password.verify(apiKey, keyRecord.keyHash)
        if (isValid) {
          // Check if key is revoked
          if (keyRecord.revokedAt) {
            logger.warn(`API key ${keyRecord.id} is revoked`, reqId)
            return null
          }

          // Check if key is expired
          if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
            logger.warn(`API key ${keyRecord.id} is expired`, reqId)
            return null
          }

          // Update lastUsedAt
          apiKeys.where({ id: keyRecord.id }).update({ lastUsedAt: new Date() })

          logger.info(`Valid API key found for user ${keyRecord.userId}`, reqId)
          return { scopes: keyRecord.scopes, userId: keyRecord.userId }
        }
      }

      return null
    } catch (error) {
      logger.error(`Error validating API key: ${error}`, reqId)
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
  const createAuthMiddleware = (
    getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>
  ) => {
    logger.info("Creating auth middleware")
    return new Elysia({
      name: "auth-middleware",
    }).resolve({ as: "global" }, async ({ cookie, headers, route, request, query }) => {
      const reqId = getStateMap().get(request).reqId

      // 1. Initial log with consistent context
      logger.info(`Checking auth for route ${route}`, reqId)

      // 2. Extract credentials once upfront
      const authHeader = headers.authorization as string | undefined
      const authQueryToken = query.dockstat as string | undefined
      const headerApiKey = headers["x-api-key"] as string | undefined
      const cookieToken = cookie?.auth_token?.value as string | undefined

      let token: string | null = null
      let apiKey: string | null = null
      let authMethod: "jwt" | "apikey" | null = null

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7)
        authMethod = "jwt"
      } else if (authHeader?.startsWith("Api-Key ")) {
        apiKey = authHeader.slice(8)
        authMethod = "apikey"
      }

      if (!token && !apiKey && authQueryToken?.startsWith("dockstat_")) {
        apiKey = authQueryToken
        authMethod = "apikey"
        logger.debug("Using dockstat query token for auth", reqId)
      }

      if (!token && !apiKey && headerApiKey) {
        apiKey = headerApiKey
        authMethod = "apikey"
      }

      if (!token && !apiKey && cookieToken) {
        token = cookieToken
        authMethod = "jwt"
      }

      let user: AuthUser | undefined

      if (token && authMethod === "jwt") {
        logger.info("Verifying JWT Token", reqId)
        const payload = await verifyAuthToken(token)
        if (payload && typeof payload.user === "object" && payload.user !== null) {
          user = { ...payload.user, authMethod: "jwt" } as AuthUser
        }
      } else if (apiKey && authMethod === "apikey") {
        logger.info("Verifying API Key", reqId)
        const keyValidation = await validateApiKey(apiKey, request)
        if (keyValidation) {
          user = {
            authMethod: "apikey",
            scopes: keyValidation.scopes,
            sub: keyValidation.userId,
          } as AuthUser
        }
      }

      // 4. Finalize & Warn only if totally unauthenticated
      if (!user) {
        logger.warn("Unauthenticated request: No valid credentials provided", reqId)
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
  const authenticated = (
    getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>,
    options?: { error?: string; response?: AnySchema }
  ) => {
    const { error = "Authentication required" } = options || {}

    logger.info("Route with Authentication hit!")

    return {
      // biome-ignore lint/suspicious/noExplicitAny: I dont know the correct Elysia typing :(
      beforeHandle: (context: any) => {
        const { isAuthenticated, set, request } = context
        const reqId = getStateMap().get(request).reqId
        if (!isAuthenticated) {
          logger.error("Not authenticated", reqId)
          set.status = 401
          return {
            code: "UNAUTHORIZED",
            description: error,
            path: new URL(request.url).pathname,
            reqId,
            status: 401,
            timestamp: new Date().toISOString(),
          } satisfies AuthErrorBody
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
  const apiKeyAuth = (
    getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>,
    options?: { error?: string; response?: AnySchema }
  ) => {
    const { error = "API key authentication required" } = options || {}

    logger.info("Route with API Key Authentication hit!")

    return {
      // biome-ignore lint/suspicious/noExplicitAny: I dont know the correct Elysia typing :(
      beforeHandle: (context: any) => {
        const { user, isAuthenticated, set, request } = context
        const reqId = getStateMap().get(request).reqId
        if (!isAuthenticated || !user || user.authMethod !== "apikey") {
          logger.error("Not authenticated with API key", reqId)
          set.status = 401
          return {
            code: "UNAUTHORIZED",
            description: error,
            path: new URL(request.url).pathname,
            reqId,
            status: 401,
            timestamp: new Date().toISOString(),
          } satisfies AuthErrorBody
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
