import type { MiddlewareFunction, RouterContextProvider } from "react-router"
import { createContext, redirect } from "react-router"
import { hasRole, hasScopes } from "./scopes"
import type { AuthService } from "./service"
import type { AuthUser, Role } from "./types"

export type { AuthUser, Role } from "./types"

/**
 * React Router v8 integration.
 *
 * `createAuthMiddleware` authenticates every request exactly once at the
 * root and publishes the user through router context — SSR loaders/actions
 * downstream read it via `context.get(authContext)` without re-verifying
 * tokens.
 */

/** Router context slot holding the authenticated user (null = anonymous). */
export const authContext = createContext<AuthUser | null>(null)

/** Reads the authenticated user from router context. */
export function getAuthUser(context: Readonly<RouterContextProvider>): AuthUser | null {
  return context.get(authContext)
}

export interface AuthMiddlewareOptions {
  /**
   * Sliding sessions: when a cookie-carried session passes half its
   * lifetime, re-issue it on the response (same `jti`). Default true.
   */
  slidingSessions?: boolean
}

/**
 * Root middleware factory. Authenticate once per request, publish the user
 * in router context, then (optionally) refresh the session cookie on the
 * way out.
 *
 *   // app/root.tsx
 *   export const middleware = [createAuthMiddleware(Auth)]
 */
export function createAuthMiddleware(
  service: AuthService,
  options: AuthMiddlewareOptions = {}
): MiddlewareFunction<Response> {
  const { slidingSessions = true } = options

  return async ({ request, context }, next) => {
    const user = await service.authenticate(request)
    context.set(authContext, user)

    const response = await next()

    if (slidingSessions && user?.authMethod === "session") {
      try {
        const cookie = await service.maybeRefreshSession(request)
        if (cookie) response.headers.append("Set-Cookie", cookie)
      } catch {
        // Refresh is best-effort; never fail the response over it
      }
    }

    return response
  }
}

export interface RequireAuthOptions {
  /** Where unauthenticated document requests are redirected. */
  loginPath?: string
  /** Require at least one of these role tiers. */
  roles?: Role[]
  /** Require all of these scopes (admins always pass). */
  scopes?: string[]
  /**
   * `"redirect"` sends browsers to `loginPath` (default);
   * `"json"` answers API clients with a 401/403 JSON body.
   */
  mode?: "redirect" | "json"
}

function jsonDenial(status: 401 | 403, message: string): Response {
  return Response.json({ error: message, success: false }, { status })
}

/**
 * Route-level guard factory reading the root middleware's context.
 *
 *   // app/routes/admin.tsx
 *   export const middleware = [createRequireAuthMiddleware({ roles: ["admin"] })]
 */
export function createRequireAuthMiddleware(
  options: RequireAuthOptions = {}
): MiddlewareFunction<Response> {
  const { loginPath = "/login", roles, scopes, mode = "redirect" } = options

  return async ({ request, context }) => {
    const user = context.get(authContext)
    const wantsJson =
      mode === "json" ||
      request.headers.get("accept")?.includes("application/json") ||
      new URL(request.url).pathname.startsWith("/api/")

    if (!user) {
      if (wantsJson) return jsonDenial(401, "Authentication required")
      throw redirect(loginPath)
    }

    if (roles && !roles.some((role) => hasRole(user, role))) {
      const message = `Role ${roles.join(" or ")} required`
      if (wantsJson) return jsonDenial(403, message)
      throw new Response(message, { status: 403 })
    }

    if (scopes && !hasRole(user, "admin") && !hasScopes(user.scopes, scopes)) {
      const message = `Missing required scope(s): ${scopes.join(", ")}`
      if (wantsJson) return jsonDenial(403, message)
      throw new Response(message, { status: 403 })
    }
  }
}

/**
 * Loader/action helper: returns the user from router context or throws a 401.
 * Requires `createAuthMiddleware` to have run (root middleware).
 */
export function requireUser(args: { context: Readonly<RouterContextProvider> }): AuthUser {
  const user = args.context.get(authContext)
  if (!user) throw new Response("Authentication required", { status: 401 })
  return user
}
