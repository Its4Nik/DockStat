import { fail, ok, query, type RouteArgs, serializeDates } from "../lib/http"
import { BaseLogger } from "../logger"
import Singletons from "../singletons"

import { BASE_URL, FRONTEND_URL, isSecureRequest, readCookie } from "@dockstat/auth"

const redirectTo = (location: string, headers = new Headers()) => {
  headers.set("Location", location)
  return new Response(null, { headers, status: 302 })
}

export const AuthLoaders = {
  getApiKeys: ({ request }: RouteArgs) => {
    const userId = query(request).get("userId") ?? undefined
    const table = Singletons.Auth.apiKeys.select([
      "id",
      "name",
      "scopes",
      "expiresAt",
      "lastUsedAt",
      "createdAt",
      "revokedAt",
    ])
    const keys = (userId ? table.where({ userId }) : table).all()
    return {
      keys: keys.map((k) =>
        serializeDates(k as unknown as Record<string, unknown>, [
          "createdAt",
          "expiresAt",
          "lastUsedAt",
          "revokedAt",
        ])
      ),
    }
  },

  getAuthLocalUsers: () => ({
    users: Singletons.Auth.users
      .select(["id", "name", "provider", "roles", "createdAt", "updatedAt"])
      .all()
      .map((u) =>
        serializeDates(u as unknown as Record<string, unknown>, ["createdAt", "updatedAt"])
      ),
  }),

  getAuthProviders: () => Singletons.Auth.oidc.listProviders(),
  isGuestRegAllowed: () => Singletons.Auth.getAllowGuestRegistration(),

  /** GET — local logout: revoke session, clear cookie, redirect */
  async localLogout({ request }: RouteArgs) {
    const headers = new Headers()
    const token = readCookie(request, Singletons.Auth.cookieName)
    if (token) {
      await Singletons.Auth.revokeSession(token)
      headers.append("Set-Cookie", Singletons.Auth.expiredSessionCookie(isSecureRequest(request)))
    }

    const redirectUri = new URL(request.url).searchParams.get("redirectUri") || FRONTEND_URL
    return redirectTo(redirectUri, headers)
  },
  localUsersExist: () => ({ exists: Singletons.Auth.localUsersExist() }),


  /** GET — finish the OIDC flow (validates state, exchanges code, sets session cookie) */
  async oAuthCallback({ params, request }: RouteArgs<{ providerId: string }>) {
    const secure = isSecureRequest(request)
    const url = new URL(request.url)

    const state = readCookie(request, "state")
    const nonce = readCookie(request, "nonce")
    const pkce = readCookie(request, "pkce")

    if (!state || !nonce || !pkce) {
      return new Response(
        "Authentication failed: Missing security cookies. Please try logging in again from the login page.",
        { status: 400 }
      )
    }

    try {
      const { cookie, clearCookies } = await Singletons.Auth.completeOidcLogin(
        params.providerId as string,
        url,
        { nonce, pkce, state },
        secure
      )

      const headers = new Headers()
      for (const c of clearCookies) headers.append("Set-Cookie", c)
      headers.append("Set-Cookie", cookie)

      return redirectTo("/", headers)
    } catch (error) {
      return new Response(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        { status: 500 }
      )
    }
  },

  /** GET — start the OIDC flow for a provider (sets state/nonce/pkce cookies, redirects) */
  async oAuthLogin({ params, request }: RouteArgs<{ providerId: string }>) {
    const { url, cookies } = await Singletons.Auth.oidc.beginLogin(
      params.providerId as string,
      `${BASE_URL}/${params.providerId}/callback`,
      isSecureRequest(request)
    )

    const headers = new Headers()
    for (const c of cookies) headers.append("Set-Cookie", c)

    return redirectTo(url.toString(), headers)
  },

  /** GET — revoke the session and redirect to the provider's end-session URL */
  async oAuthLogout({ params, request }: RouteArgs<{ providerId: string }>) {
    const headers = new Headers()
    const token = readCookie(request, Singletons.Auth.cookieName)
    if (token) {
      await Singletons.Auth.revokeSession(token)
      headers.append("Set-Cookie", Singletons.Auth.expiredSessionCookie(isSecureRequest(request)))
    }

    const redirectUri = new URL(request.url).searchParams.get("redirectUri") ?? FRONTEND_URL
    const endUrl = await Singletons.Auth.oidc.endSessionUrl(
      params.providerId as string,
      redirectUri
    )

    return redirectTo(endUrl.toString(), headers)
  },

  /** GET — verify a token (Authorization header or session cookie) */
  async verifyToken({ request }: RouteArgs) {
    const user = await Singletons.Auth.authenticate(request)
    if (!user) return Response.json({ error: "Invalid or missing token" }, { status: 401 })
    return { user }
  },

  /** GET — mint a short-lived token for WebSocket connections */
  async wsToken({ request }: RouteArgs) {
    const reqLog = BaseLogger.spawn("WS-Token")
    const url = new URL(request.url)

    reqLog.info(
      `WS token requested: url=${url.pathname}${url.search}, secure=${isSecureRequest(request)}`
    )

    const token = await Singletons.Auth.issueWsToken(request)
    if (!token) {
      reqLog.warn("WS token request rejected: authentication failed")
      return fail(401, "Authentication required")
    }

    reqLog.info(`WS token issued: expiresIn=${Singletons.Auth.wsTokenTtlSec}s`)
    return { expiresIn: Singletons.Auth.wsTokenTtlSec, token }
  },
}
