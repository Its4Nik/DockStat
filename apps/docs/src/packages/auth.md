# `@dockstat/auth`

`@dockstat/auth` is an OIDC/OAuth proxy and JWT middleware for ElysiaJS. It
exposes a typed `AuthHandler` on the backend, a React `AuthProvider` on the
frontend, and a small set of helpers that wire authentication into routes and
WebSockets.

## Capabilities at a glance

- OAuth 2.0 authorization code flow with PKCE for any provider that exposes
  OpenID Connect discovery (Authentik, Google, GitHub, Microsoft, Keycloak,
  Okta, etc.).
- Local-user authentication with Argon2id hashes.
- API-key authentication with revocation and per-key scoping.
- Server-side session tracking so logout and JWT revocation work even
  before the JWT itself expires.
- React context provider with automatic token refresh and cross-tab sync.

## Backend setup

Wire the handler into your Elysia app:

```typescript
import { AuthHandler as AuthHandlerFactory } from "@dockstat/auth"
import BaseLogger from "./logger"
import { DockStatDB } from "./database"

export const AuthHandler = new AuthHandlerFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger,
  () => stateMap,
  allowGuestRegistration,
)

export const Middleware = AuthHandler.middleware.createAuthMiddleware(
  () => stateMap,
)
```

`createAuthMiddleware()` resolves `{ isAuthenticated, user }` on every
incoming request. Routes opt in via `authenticated()`:

```typescript
import { Elysia, t } from "elysia"
import { authenticated } from "@dockstat/auth"

const app = new Elysia()
  .use(Middleware)
  .get("/profile", ({ user }) => user, authenticated())
```

`authenticated()` returns a beforeHandle that rejects with `401` when no user
is present, attaches a security scheme to the OpenAPI spec, and accepts any
custom error or response schema via `authenticated({ response, error })`.

### Token sources

The middleware checks credentials in this order:

1. `Authorization: Bearer <jwt>` header.
2. `Api-Key: <key>` or `X-API-Key: <key>` header.
3. `auth_token` cookie.

WebSockets cannot set custom headers on upgrades, so the WS middleware
accepts the JWT via `?token=<jwt>`.

### Session lifecycle

Each successful login returns a JWT with a unique `jti`. The handler inserts
the `jti` into the `auth-sessions` table along with an expiry. The `verify`
endpoint rejects requests whose `jti` is missing, which catches both
revoked tokens and tokens that pre-date a database wipe. Logout (via
`GET /auth/:providerId/logout` or `POST /auth/revoke`) deletes the row.

### API-key support

API keys are stored hashed with Argon2id. They support an optional expiry and
a scope string (default `"*"`). The `validateApiKey` step also updates
`last_used_at` to make inactive keys easy to spot.

```http
POST /auth/api-keys/
Content-Type: application/json
Authorization: Bearer <admin-jwt>

{
  "userId": "u_abc",
  "name": "CI deploy key",
  "scopes": "deploy:write",
  "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

The response includes the plaintext key exactly once; persist it in your
secret manager immediately.

### Public endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/auth/providers` | – (callable anonymously in this implementation) | List configured OIDC providers |
| POST   | `/auth/providers` | required | Register a new provider |
| DELETE | `/auth/providers/:providerId` | required | Delete a provider |
| GET    | `/auth/:providerId/login` | – | Begin the OAuth dance |
| GET    | `/auth/:providerId/callback` | – | Complete the OAuth dance |
| GET    | `/auth/:providerId/logout` | – | Build the provider logout URL |
| POST   | `/auth/revoke` | – | Revoke the bearer / cookie and delete the session |
| GET    | `/auth/verify` | – | Validate the current token |
| GET    | `/auth/users` | required | List local users |
| POST   | `/auth/local/register` | conditional | Register a new local user |
| POST   | `/auth/local/login` | – | Begin a local-password login |
| GET    | `/auth/local/login` | – | Redirect to the login page |
| GET    | `/auth/local/logout` | – | Log out and clear cookies |
| GET    | `/auth/local/exists` | – | Check whether any local user exists |
| GET    | `/auth/local/allow-guest` | – | Read the guest registration flag |
| POST   | `/auth/guest/:allow` | required | Set the guest registration flag |
| GET    | `/auth/api-keys/` | – | List API keys |
| GET    | `/auth/api-keys/:id` | – | Read one key (without the secret) |
| DELETE | `/auth/api-keys/:id` | – | Revoke a key |

## Frontend integration

Wrap your tree in `AuthProvider`:

```tsx
import { AuthProvider } from "@dockstat/auth/client"

export function AppRoot({ children }: { children: ReactNode }) {
  return <AuthProvider apiBase="/api/v2">{children}</AuthProvider>
}
```

The provider handles token refresh, cross-tab state sync, OAuth callback
parsing, and last-known redirect restoration. The exposed hooks are:

| Hook | Returns |
|------|---------|
| `useAuth()` | `{ user, token, loading, error, login, logout, refreshToken, clearError }` |
| `useUser()` | Current user object (or `null`) |
| `useIsAuthenticated()` | Boolean |
| `useIsLoading()` | Boolean |
| `useAuthError()` | Last error message |

`ProtectedRoute` redirects unauthenticated users to the login page and
preserves the original target via the provider's redirect feature.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `BASE_URL` | Public URL of the auth routes (used for OAuth callback URLs) |
| `FRONTEND_URL` | Where the browser lands after a successful callback |
| `JWT_SECRET` | HMAC secret used to sign tokens (rotate on incidents) |
| `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER`, `OIDC_REDIRECT_URI`, `OIDC_SCOPE` | Default provider overrides |

> [!WARNING]
> Treat `JWT_SECRET` like a database password. The default from the README is
> a placeholder; rotate the secret and never commit a real value.

## Next steps

- See [apps/api.md](../apps/api.md) for how the API mounts `@dockstat/auth`.
- See [apps/dockstat.md](../apps/dockstat.md) for the React provider wiring.
- See [resources/deployment.md](../resources/deployment.md) for the production
  hardening checklist (cookies, `Secure` flag, secret rotation).
