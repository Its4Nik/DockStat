import Actions from "../action"
import { validate, withValidation } from "../middleware/withValidation"
import Loaders from "../loader"
import { z } from "zod"
import { basicUserSchema } from "./user"

/**
 * Auth surface, schema-driven.
 *
 * Every group becomes a generated route under `/api/v3/` (see
 * `.server/scripts/index.ts`):
 *
 * - `path`       — route path relative to `/api/v3/`
 * - `isPublic`   — mounted outside the require-auth layout (login, OIDC, ...)
 * - `roles`      — emits a `createRequireAuthMiddleware` role guard
 * - `loader`     — GET handler exported by the generated route
 * - `_ops`       — validated mutations; single-op groups infer the operation
 *                  so plain JSON bodies (no `__operation__`) keep working
 */

/** Mutations whose input is the request context (params/headers), not a body. */
const noBodySchema = z.any()

const apiKeySchema = z.object({
  expiresAt: z.string().optional(),
  name: z.string().min(1),
  scopes: z.string().optional(),
  userId: z.string().min(1),
})

const providerSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  icon: z.string().optional(),
  issuer_url: z.string().min(1),
  logout_url: z.string().nullish(),
  name: z.string().optional(),
  scopes: z.string().nullish(),
})

export const AuthValidation = {
  /** DELETE /api/v3/auth/api-keys/:id — revoke an API key */
  ApiKey: withValidation(
    { revoke: validate(noBodySchema, Actions.Auth.revokeApiKey) },
    { path: "auth/api-keys/:id" }
  ),

  /** GET /api/v3/auth/api-keys?userId= — list API keys */
  ApiKeys: withValidation({}, { loader: Loaders.Auth.getApiKeys, path: "auth/api-keys" }),

  /** POST /api/v3/auth/guest/:enable|disable — toggle guest registration (admin) */
  Guest: withValidation(
    { toggle: validate(noBodySchema, Actions.Auth.toggleGuestRegistration) },
    { path: "auth/guest/:allow", roles: ["admin"] }
  ),

  /** GET /api/v3/auth/local/allow-guest — is guest registration allowed? */
  LocalAllowGuest: withValidation(
    {},
    { isPublic: true, loader: Loaders.Auth.isGuestRegAllowed, path: "auth/local/allow-guest" }
  ),

  /** GET /api/v3/auth/local/exists — do local users exist (setup wizard gate) */
  LocalExists: withValidation(
    {},
    { isPublic: true, loader: Loaders.Auth.localUsersExist, path: "auth/local/exists" }
  ),

  /** POST /api/v3/auth/local/login — local username/password login */
  LocalLogin: withValidation(
    { login: validate(basicUserSchema, Actions.Auth.localLogin) },
    { isPublic: true, path: "auth/local/login" }
  ),

  /** GET /api/v3/auth/local/logout?redirectUri= — revoke session, redirect */
  LocalLogout: withValidation(
    {},
    { isPublic: true, loader: Loaders.Auth.localLogout, path: "auth/local/logout" }
  ),

  /** POST /api/v3/auth/local/register — register a local user */
  LocalRegister: withValidation(
    { register: validate(basicUserSchema, Actions.Auth.register) },
    { isPublic: true, path: "auth/local/register" }
  ),

  /** GET /api/v3/auth/:providerId/callback — OIDC redirect target */
  OidcCallback: withValidation(
    {},
    { isPublic: true, loader: Loaders.Auth.oAuthCallback, path: "auth/:providerId/callback" }
  ),

  /** GET /api/v3/auth/:providerId/login — start the OIDC flow */
  OidcLogin: withValidation(
    {},
    { isPublic: true, loader: Loaders.Auth.oAuthLogin, path: "auth/:providerId/login" }
  ),

  /** GET /api/v3/auth/:providerId/logout — end the OIDC session */
  OidcLogout: withValidation(
    {},
    { isPublic: true, loader: Loaders.Auth.oAuthLogout, path: "auth/:providerId/logout" }
  ),

  /** DELETE /api/v3/auth/providers/:providerId — remove an OIDC provider (admin) */
  Provider: withValidation(
    { delete: validate(noBodySchema, Actions.Auth.deleteProvider) },
    { path: "auth/providers/:providerId", roles: ["admin"] }
  ),

  /** /api/v3/auth/providers — list (GET) / create (POST) OIDC providers (admin) */
  Providers: withValidation(
    { create: validate(providerSchema, Actions.Auth.createProvider) },
    { loader: Loaders.Auth.getAuthProviders, path: "auth/providers", roles: ["admin"] }
  ),

  /** POST /api/v3/auth/revoke — revoke the caller's session (Bearer or cookie) */
  Revoke: withValidation(
    { revoke: validate(noBodySchema, Actions.Auth.revokeSession) },
    { isPublic: true, path: "auth/revoke" }
  ),

  /** DELETE /api/v3/auth/users/:userId — remove a local user (admin) */
  User: withValidation(
    { delete: validate(noBodySchema, Actions.Auth.deleteUser) },
    { path: "auth/users/:userId", roles: ["admin"] }
  ),

  /** GET /api/v3/auth/users — list local users (admin) */
  Users: withValidation(
    {},
    { loader: Loaders.Auth.getAuthLocalUsers, path: "auth/users", roles: ["admin"] }
  ),

  /** GET /api/v3/auth/verify — verify a Bearer token / session cookie */
  Verify: withValidation(
    {},
    { isPublic: true, loader: Loaders.Auth.verifyToken, path: "auth/verify" }
  ),

  /** GET /api/v3/auth/ws-token — exchange session for a short-lived WS token */
  WsToken: withValidation({}, { loader: Loaders.Auth.wsToken, path: "auth/ws-token" }),
}
