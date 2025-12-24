import BaseLogger from "../base-logger"
import { Elysia } from "elysia"

const logger = BaseLogger.spawn("Auth-Middleware")

/**
 * Authentication context type
 */
export interface AuthContext {
  user: {
    id: string
    email: string
    name: string
    roles: string[]
  } | null
  isAuthenticated: boolean
}

/**
 * Configuration for the authentication middleware
 */
export interface AuthConfig {
  /**
   * Whether authentication is enabled
   * Set to false to bypass authentication (useful for development)
   */
  enabled: boolean

  /**
   * Routes that should be excluded from authentication
   * Supports exact matches and prefix matches (ending with *)
   */
  publicRoutes: string[]

  /**
   * OIDC configuration placeholder
   * TODO: Extend with actual OIDC provider settings
   */
  oidc?: {
    issuer?: string
    clientId?: string
    clientSecret?: string
    redirectUri?: string
    scope?: string
  }

  /**
   * API key authentication placeholder
   * TODO: Implement API key validation
   */
  apiKeys?: {
    enabled: boolean
    headerName?: string
  }
}

/**
 * Default authentication configuration
 */
export const defaultAuthConfig: AuthConfig = {
  enabled: process.env.AUTH_ENABLED === "true",
  publicRoutes: ["/health", "/public/*", "/api/compare/*", "/api/public/*", "/status"],
  oidc: {
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    redirectUri: process.env.OIDC_REDIRECT_URI,
    scope: process.env.OIDC_SCOPE || "openid profile email",
  },
  apiKeys: {
    enabled: process.env.API_KEYS_ENABLED === "true",
    headerName: "X-API-Key",
  },
}

/**
 * Check if a route matches any of the public route patterns
 */
function isPublicRoute(path: string, publicRoutes: string[]): boolean {
  for (const pattern of publicRoutes) {
    // Exact match
    if (pattern === path) {
      return true
    }

    // Prefix match (pattern ends with *)
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1)
      if (path.startsWith(prefix)) {
        return true
      }
    }
  }
  return false
}

/**
 * Validate API key placeholder
 * TODO: Implement actual API key validation against database
 */
function validateApiKey(_apiKey: string): AuthContext["user"] | null {
  // Placeholder: Accept any non-empty API key for now
  // TODO: Validate against database of API keys
  logger.debug("API key validation placeholder - implement with database lookup")

  // Return a placeholder user for API key auth
  return {
    id: "api-key-user",
    email: "api@dockstore.local",
    name: "API Key User",
    roles: ["api"],
  }
}

/**
 * Validate OIDC token placeholder
 * TODO: Implement actual OIDC token validation
 */
async function validateOidcToken(
  _token: string,
  _config: AuthConfig["oidc"]
): Promise<AuthContext["user"] | null> {
  // Placeholder: OIDC validation not yet implemented
  // TODO: Implement actual OIDC token validation
  //   1. Verify token signature
  //   2. Check token expiration
  //   3. Validate issuer and audience
  //   4. Extract user claims
  logger.debug("OIDC token validation placeholder - implement with OIDC provider")

  return null
}

/**
 * Create the authentication middleware
 *
 * This middleware provides:
 * - Route-based authentication bypass for public routes
 * - API key authentication (placeholder)
 * - OIDC/OAuth2 authentication (placeholder)
 * - User context injection into request handlers
 *
 * @param config - Authentication configuration
 * @returns Elysia plugin with authentication middleware
 *
 * @example
 * ```ts
 * const app = new Elysia()
 *   .use(createAuthMiddleware({ enabled: true, publicRoutes: ["/health"] }))
 *   .get("/protected", ({ auth }) => {
 *     if (!auth.isAuthenticated) {
 *       return { error: "Unauthorized" }
 *     }
 *     return { user: auth.user }
 *   })
 * ```
 */
export function createAuthMiddleware(config: Partial<AuthConfig> = {}) {
  const authConfig: AuthConfig = {
    ...defaultAuthConfig,
    ...config,
    publicRoutes: [...defaultAuthConfig.publicRoutes, ...(config.publicRoutes || [])],
  }

  return new Elysia({ name: "auth-middleware" })
    .derive(async ({ request, set }): Promise<{ auth: AuthContext }> => {
      const url = new URL(request.url)
      const path = url.pathname

      // Initialize auth context
      let authContext: AuthContext = {
        user: null,
        isAuthenticated: false,
      }

      // Skip authentication for public routes
      if (isPublicRoute(path, authConfig.publicRoutes)) {
        logger.debug(`Public route accessed: ${path}`)
        return { auth: authContext }
      }

      // Skip authentication if disabled
      if (!authConfig.enabled) {
        logger.debug("Authentication disabled, allowing access")
        // Return a mock user when auth is disabled (for development)
        authContext = {
          user: {
            id: "dev-user",
            email: "dev@dockstore.local",
            name: "Development User",
            roles: ["admin"],
          },
          isAuthenticated: true,
        }
        return { auth: authContext }
      }

      // Try API key authentication
      if (authConfig.apiKeys?.enabled) {
        const headerName = authConfig.apiKeys.headerName || "X-API-Key"
        const apiKey = request.headers.get(headerName)

        if (apiKey) {
          const user = validateApiKey(apiKey)
          if (user) {
            logger.info(`API key authentication successful for: ${user.email}`)
            authContext = {
              user,
              isAuthenticated: true,
            }
            return { auth: authContext }
          }
        }
      }

      // Try Bearer token (OIDC) authentication
      const authHeader = request.headers.get("Authorization")
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7)
        const user = await validateOidcToken(token, authConfig.oidc)

        if (user) {
          logger.info(`OIDC authentication successful for: ${user.email}`)
          authContext = {
            user,
            isAuthenticated: true,
          }
          return { auth: authContext }
        }
      }

      // No valid authentication found for protected route
      logger.warn(`Unauthorized access attempt to: ${path}`)
      set.status = 401
      set.headers["WWW-Authenticate"] = 'Bearer realm="DockStore Verification"'

      return { auth: authContext }
    })
    .onBeforeHandle(({ auth, set, path }) => {
      // Check if authentication is required and not provided
      if (
        !isPublicRoute(path, authConfig.publicRoutes) &&
        authConfig.enabled &&
        !auth.isAuthenticated
      ) {
        set.status = 401
        return {
          error: "Unauthorized",
          message: "Authentication required to access this resource",
          hint: "Provide a valid API key in X-API-Key header or Bearer token in Authorization header",
        }
      }
    })
}

/**
 * Guard decorator for requiring specific roles
 *
 * @param requiredRoles - Array of roles that are allowed to access the route
 * @returns Middleware function that checks user roles
 *
 * @example
 * ```ts
 * app.get("/admin", requireRoles(["admin"]), ({ auth }) => {
 *   return { message: "Admin access granted" }
 * })
 * ```
 */
export function requireRoles(requiredRoles: string[]) {
  return ({ auth, set }: { auth: AuthContext; set: { status: number } }) => {
    if (!auth.isAuthenticated || !auth.user) {
      set.status = 401
      return {
        error: "Unauthorized",
        message: "Authentication required",
      }
    }

    const hasRequiredRole = requiredRoles.some((role) => auth.user!.roles.includes(role))

    if (!hasRequiredRole) {
      set.status = 403
      return {
        error: "Forbidden",
        message: `Requires one of the following roles: ${requiredRoles.join(", ")}`,
      }
    }
  }
}

/**
 * Helper to check if user has a specific role
 */
export function hasRole(auth: AuthContext, role: string): boolean {
  return auth.isAuthenticated && auth.user?.roles.includes(role) === true
}

/**
 * Helper to check if user has any of the specified roles
 */
export function hasAnyRole(auth: AuthContext, roles: string[]): boolean {
  return auth.isAuthenticated && roles.some((role) => auth.user?.roles.includes(role))
}

/**
 * Helper to check if user has all of the specified roles
 */
export function hasAllRoles(auth: AuthContext, roles: string[]): boolean {
  return auth.isAuthenticated && roles.every((role) => auth.user?.roles.includes(role))
}
