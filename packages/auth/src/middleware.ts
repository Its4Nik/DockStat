import type Logger from "@dockstat/logger"
import { DockStatErrorCode, DockStatError } from "@dockstat/utils"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import Elysia, { type AnySchema } from "elysia"
import type { ElysiaWS } from "elysia/ws"
import type { ApiKeysTable } from "./types"
import { verifyAuthToken } from "./utils/jwt"
import { truncate } from "@dockstat/utils"

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

  const validateApiKey = async (
    apiKey: string,
    request: Request
  ): Promise<{ userId: string; scopes: string } | null | "REVOKED" | "EXPIRED"> => {
    if (!apiKeys) return null

    const reqId = getStateMap().get(request).reqId

    try {
      const allKeys = apiKeys
        .select(["id", "userId", "keyHash", "scopes", "expiresAt", "revokedAt"])
        .all()

      for (const keyRecord of allKeys) {
        const isValid = await Bun.password.verify(apiKey, keyRecord.keyHash)
        if (isValid) {
          if (keyRecord.revokedAt) {
            logger.warn(`API key ${keyRecord.id} is revoked`, reqId)
            return "REVOKED"
          }

          if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
            logger.warn(`API key ${keyRecord.id} is expired`, reqId)
            return "EXPIRED"
          }

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

  const createAuthMiddleware = (
    getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>
  ) => {
    logger.info("Creating auth middleware")
    return new Elysia({
      name: "auth-middleware",
    }).resolve({ as: "global" }, async ({ cookie, headers, route, request }) => {
      const reqId = getStateMap().get(request).reqId

      logger.debug(
        `Request Debug: ${JSON.stringify({
          headers: truncate(headers.authorization ?? "", 10),
          route,
          cookies: Object.entries(cookie).map(([cookieName, cookie]) => {
            return { [cookieName]: truncate(JSON.stringify(cookie), 10) }
          }),
        })}`
      )

      logger.info(`Checking auth for route ${route}`, reqId)

      const authHeader = headers.authorization as string | undefined
      const headerApiKey = headers["x-api-key"] as string | undefined
      const cookieToken = cookie?.auth_token?.value as string | undefined

      let token: string | null = null
      let apiKey: string | null = null
      let authMethod: "jwt" | "apikey" | null = null

      if (authHeader?.startsWith("Bearer ")) {
        logger.info("Found Bearer token")
        token = authHeader.slice(7)
        if (token?.startsWith("dockstat_")) {
          authMethod = "apikey"
          apiKey = token
          logger.debug("Using dockstat bearer token for auth", reqId)
        } else {
          authMethod = "jwt"
        }
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
        if (keyValidation !== "EXPIRED" && keyValidation !== "REVOKED") {
          user = {
            authMethod: "apikey",
            scopes: keyValidation.scopes,
            sub: keyValidation.userId,
          } as AuthUser
        }
      }

      if (!user) {
        logger.warn("Unauthenticated request: No valid credentials provided", reqId)
      }

      return {
        isAuthenticated: !!user,
        user,
      }
    })
  }

  const authenticated = (
    getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>,
    options?: { error?: string; response?: AnySchema }
  ) => {
    const { error = "Authentication required" } = options || {}

    logger.info("Route with Authentication hit!")

    return {
      // biome-ignore lint/suspicious/noExplicitAny: I dont know the correct Elysia typing :(
      beforeHandle: (context: any) => {
        const { isAuthenticated, request } = context
        const reqId = getStateMap().get(request).reqId
        if (!isAuthenticated) {
          logger.error("Not authenticated", reqId)
          throw new DockStatError({
            code: DockStatErrorCode.UNAUTHORIZED,
            description: error,
            path: new URL(request.url).pathname,
            reqId,
            status: 401,
          })
        }
      },
      detail: {
        description: "Requires authentication",
        security: [{ bearerAuth: [] as string[] }],
      },
      ...(options?.response && { response: options.response }),
    }
  }

  const isAuthenticatedUser = (user: AuthUser | undefined): user is AuthUser => {
    return user !== undefined && typeof user === "object" && "sub" in user
  }

  const requireAuth = (context: { user?: AuthUser; isAuthenticated: boolean }): AuthUser => {
    if (!context.isAuthenticated || !context.user) {
      throw new DockStatError({
        code: DockStatErrorCode.UNAUTHORIZED,
        description: "Authentication required",
        status: 401,
      })
    }
    return context.user
  }

  const withAuth = <T extends Record<string, unknown>, R>(
    handler: (context: { user: AuthUser } & T) => R
  ): ((context: { user?: AuthUser; isAuthenticated: boolean } & T) => R) => {
    return (context) => {
      const user = requireAuth(context)
      return handler({ ...context, user })
    }
  }

  const apiKeyAuth = (
    getStateMap: () => WeakMap<Request, { startTime: number; reqId: string }>,
    options?: { error?: string; response?: AnySchema }
  ) => {
    const { error = "API key authentication required" } = options || {}

    logger.info("Route with API Key Authentication hit!")

    return {
      // biome-ignore lint/suspicious/noExplicitAny: I dont know the correct Elysia typing :(
      beforeHandle: (context: any) => {
        const { user, isAuthenticated, request } = context
        const reqId = getStateMap().get(request).reqId
        if (!isAuthenticated || !user || user.authMethod !== "apikey") {
          logger.error("Not authenticated with API key", reqId)
          throw new DockStatError({
            code: DockStatErrorCode.UNAUTHORIZED,
            description: error,
            path: new URL(request.url).pathname,
            reqId,
            status: 401,
          })
        }
      },
      detail: {
        description: "Requires API key authentication",
        security: [{ apiKeyAuth: [] as string[] }],
      },
      ...(options?.response && { response: options.response }),
    }
  }

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

  const getWsUser = (ws: { data: Partial<AuthWsContext> }): AuthUser | null => {
    return ws.data.user || null
  }

  const createAuthenticatedWsHandler = (options?: { extractToken?: WsTokenExtractor }) => {
    return {
      message: (ws: ElysiaWS<{ user?: AuthUser }>, _message: unknown) => {
        if (!ws.data.user) {
          ws.send(JSON.stringify({ error: "Not authenticated" }))
          ws.close(1008, "Authentication required")
          return
        }
      },
      open: async (ws: ElysiaWS<{ user?: AuthUser; userId?: string }>) => {
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

export interface AuthWsContext {
  user?: AuthUser
  userId?: string
  isAuthenticated: boolean
}

export type JWTPayload = {
  user: AuthUser
  iat?: number
  exp?: number
}

export type WsTokenExtractor = (ws: ElysiaWS) => string | null
