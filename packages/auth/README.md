# @dockstat/auth

`@dockstat/auth` handles authentication for DockStat: revocable JWT
sessions, OIDC provider login, and scoped API keys. Version 2 is built for
React Router v8 server-side rendering — one root middleware authenticates
each request exactly once and publishes the user through router context —
while the core stays framework-agnostic so you can use it in any Bun
project.

## Features

- **Secure JWT sessions** — HS256 tokens with enforced issuer and audience
  claims, tracked in SQLite so every session is revocable. Browser sessions
  live in an HttpOnly `SameSite=Lax` cookie; no tokens in localStorage.
- **Sliding sessions** — when a cookie-carried session passes half its
  lifetime, the middleware transparently re-issues it (same `jti`).
- **OIDC login** — authorization-code flow with PKCE, state, and nonce for
  any compliant provider (Authentik, Google, GitHub, Keycloak, Okta, and
  more), with discovery caching and per-provider logout URLs.
- **API keys** — argon2id-hashed keys that embed their row id, so
  validation is one indexed lookup instead of scanning every hash. Keys
  carry scopes, expiry dates, and revocation.
- **Roles and scopes** — hierarchical roles (`admin` > `editor` >
  `viewer`) plus wildcard scope matching (`docker:read`, `docker:*`, `*`)
  with guard helpers for routes, loaders, and actions.
- **WebSocket tokens** — short-lived, audience-restricted tokens that let
  WebSocket clients authenticate even when they can't send cookies.
- **SSR-first React Router v8 integration** — typed context, route guards,
  and cookie handling designed for loaders, actions, and middleware.

## Requirements

- Bun 1.3.10 or later
- TypeScript 5 or later
- React Router 8 (optional; only needed for the
  `@dockstat/auth/react-router` entry point)

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DOCKSTAT_AUTH_JWT_SECRET` | In production | JWT signing secret. Use at least 32 random characters. Falls back to an insecure development secret when `NODE_ENV` isn't `production`. |
| `DOCKSTAT_AUTH_CRYPTO_SECRET` | Recommended | Encrypts provider client secrets at rest. |
| `BASE_URL` | No | Base URL of the auth endpoints. Defaults to `http://localhost:3000/api/v2/auth`. Used as the OIDC redirect base. |
| `FRONTEND_URL` | No | Frontend origin for redirects. Defaults to `http://localhost:3000`. |

> [!IMPORTANT]
> The server refuses to start in production without
> `DOCKSTAT_AUTH_JWT_SECRET`. Generate one with
> `bun -e "console.log(crypto.randomUUID().repeat(2))"`.

## Installation

The package ships three entry points:

```txt
@dockstat/auth               core service, JWT, API keys, OIDC, guards
@dockstat/auth/react-router  context, root middleware, route guards
@dockstat/auth/types         shared types only
```

## Quick start with React Router v8

The following steps wire authentication into an SSR React Router app.

### 1. Create the service

Create one `AuthService` per process and share it as a singleton. It
creates (and migrates) its tables on construction.

```ts
// app/.server/singletons/auth.ts
import { AuthService } from "@dockstat/auth"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"

export const Auth = new AuthService(DockStatDB._sqliteWrapper, BaseLogger, {
  // Guest registration reads the config table dynamically, so settings
  // changes apply without a restart
  getAllowGuestRegistration: () =>
    DockStatDB.configTable.select(["additionalSettings"]).first()
      ?.additionalSettings?.enableRegistration || false,
})
```

### 2. Add the root middleware

`createAuthMiddleware` authenticates every request once — Bearer header,
API key, `?token=` query, or session cookie — and publishes the result in
router context. Downstream loaders and actions read it without
re-verifying anything.

```tsx
// app/root.tsx
import { authContext, createAuthMiddleware } from "@dockstat/auth/react-router"
import { Auth } from "./.server/singletons/auth"

export const middleware = [createAuthMiddleware(Auth)]

export const loader = ({ context }: Route.LoaderArgs) => ({
  authenticated: context.get(authContext),
})
```

### 3. Protect routes

Use `createRequireAuthMiddleware` on a layout (or any route) to enforce
authentication, roles, and scopes. Document requests redirect to your
login page; API requests receive a JSON 401 or 403 instead.

```tsx
// app/routes/layout.tsx — everything below requires a session
export const middleware = [
  createRequireAuthMiddleware({ loginPath: "/login" }),
]
```

```tsx
// app/routes/admin.tsx — admin-only, JSON denials for API clients
export const middleware = [
  createRequireAuthMiddleware({ mode: "json", roles: ["admin"] }),
]
```

### 4. Read the user in loaders and actions

```ts
import { getAuthUser } from "@dockstat/auth/react-router"

export async function loader({ context }: Route.LoaderArgs) {
  const user = getAuthUser(context) // AuthUser | null
  if (!user) throw new Response("Authentication required", { status: 401 })
  return { name: user.name }
}
```

## Roles and scopes

Roles are hierarchical: a user holding a higher role satisfies every check
for a lower one. Custom roles are allowed and rank below `viewer`.

| Role | Rank | Typical use |
| --- | --- | --- |
| `admin` | 100 | Full access; passes every scope check |
| `editor` | 50 | Create and edit resources |
| `viewer` | 10 | Read-only access |

The first registered user becomes `admin` (configurable via
`firstUserRole`); everyone after starts with `viewer` (or
`defaultRoles`).

Scopes are space-separated strings with trailing wildcards:

```txt
docker:read  docker:write  — exact matches
docker:*                    — everything under docker
*                           — everything
```

### Guard helpers

The core export throws `AuthError` (with an HTTP `status` of 401 or 403)
when a check fails, so they work in any server context:

```ts
import { hasAnyRole, hasScopes, requireAuth, requireRole, requireScopes } from "@dockstat/auth"

requireAuth(user)                       // 401 when anonymous
requireRole(user, "editor")             // 403 below the editor tier
requireScopes(user, "docker:read")      // 403 without the scope (admins pass)

hasScopes(user.scopes, ["docker:read"]) // boolean, no throw
hasAnyRole(user, "admin", "editor")     // boolean, no throw
```

## Token sources

One function decides where credentials come from, in this order:

1. `Authorization: Bearer <jwt>`
2. `Authorization: Api-Key <key>`
3. `X-API-Key: <key>`
4. `?token=<jwt>` (WebSocket upgrades can't set headers)
5. `auth_token` session cookie (HttpOnly, `SameSite=Lax`, `Secure` on
   HTTPS)

Use `extractCredentials(request)` yourself if you need the same behavior,
or `AuthService.authenticate(request)` for a fully verified `AuthUser`.

> [!NOTE]
> The cookie name is configurable via the `cookieName` service option; the
> default is `auth_token`.

## Local users and sessions

Local users authenticate with argon2id password hashes. A successful login
issues a tracked session and its cookie:

```ts
const result = await Auth.loginLocal("nik", "correct-horse", isSecure)

if (result.ok) {
  // Attach result.cookie as a Set-Cookie header — the JWT never needs
  // to reach client JavaScript
  return data({ user: result.user }, { headers: { "Set-Cookie": result.cookie } })
}
```

Registration guards itself: guests can only register while guest
registration is enabled, authenticated users can always create accounts,
and the first user ever becomes admin.

```ts
const registered = await Auth.registerLocal(name, pass, currentUser)
```

Other session helpers:

- `Auth.revokeSession(token)` — logout (idempotent)
- `Auth.revokeAllSessions(userId)` — admin kill switch
- `Auth.setRoles(userId, ["editor"])` — update stored roles
- `Auth.localUsersExist()` — first-run detection

## OIDC

The OIDC module implements the authorization-code flow with PKCE, state,
and nonce. The security values travel in short-lived HttpOnly cookies
between the redirect legs — never in URLs.

Wire the three endpoints yourself (loaders work well for this); the
service handles the flow:

```ts
// GET /api/v2/auth/:providerId/login
export async function loader({ params, request }: Route.LoaderArgs) {
  const { url, cookies } = await Auth.oidc.beginLogin(
    params.providerId,
    `${BASE_URL}/${params.providerId}/callback`,
    isSecureRequest(request),
  )
  const headers = new Headers()
  for (const cookie of cookies) headers.append("Set-Cookie", cookie)
  return redirect(url.toString(), { headers })
}

// GET /api/v2/auth/:providerId/callback
export async function loader({ params, request }: Route.LoaderArgs) {
  const { cookie, clearCookies } = await Auth.completeOidcLogin(
    params.providerId,
    new URL(request.url),
    {
      state: readCookie(request, "state"),
      nonce: readCookie(request, "nonce"),
      pkce: readCookie(request, "pkce"),
    },
    isSecureRequest(request),
  )
  const headers = new Headers()
  for (const c of clearCookies) headers.append("Set-Cookie", c)
  headers.append("Set-Cookie", cookie)
  return redirect("/", { headers })
}
```

On first login the service upserts a user record — roles persist across
logins — and issues the session. `Auth.oidc.endSessionUrl(providerId, uri)`
builds the provider logout redirect, preferring a configured `logout_url`.

Manage providers through `Auth.oidc.listProviders()`,
`createProvider({...})`, and `deleteProvider(id)`. Client secrets are
encrypted at rest with `DOCKSTAT_AUTH_CRYPTO_SECRET`.

## API keys

Keys embed their row id (`dockstat_<uuid>_<secret>`), so validation does a
single indexed lookup plus one argon2 verify. The full key is returned
exactly once at creation; only the hash is stored.

```ts
const created = await Auth.createApiKey({
  name: "CI pipeline",
  userId: user.sub,
  scopes: "docker:read metrics:*", // default "*"
  expiresAt: null,                 // optional Date
})

// Return created.apiKey once — it can't be recovered later
```

Presented keys are checked for revocation and expiry, and `lastUsedAt` is
stamped on success. Revoke with `Auth.revokeApiKey(id)`. Requests
authenticated with a key carry `authMethod: "apikey"` and the key's
scopes; role checks fail for them because keys hold scopes, not roles.

## WebSocket authentication

Browsers can't always send cookies on WebSocket upgrades — for example
when the socket runs on a different port or origin. For those clients,
exchange an authenticated request for a short-lived WS token (60 seconds
by default, separate audience so it can't be replayed as a session
bearer):

```ts
// GET /api/v2/auth/ws-token
const token = await Auth.issueWsToken(request) // null when unauthenticated
```

The client fetches that endpoint, then connects with
`ws://…?token=<jwt>`. On the server, `Auth.verifyWsToken(token)` accepts
both WS tokens and regular session tokens (subject to revocation) and
returns the `AuthUser`.

## Storage

The service owns four tables and migrates them automatically when the
schema changes.

<details>
<summary>Table schemas</summary>

- `oidc-providers` — `id`, `name`, `icon`, `issuer_url`, `client_id`,
  `client_secret` (encrypted), `scopes`, `logout_url`, `created_at`
- `users` — `id`, `name`, `passHash`, `provider` (`"local"` or a provider
  id), `externalId` (OIDC `sub`), `roles` (space-separated), `createdAt`,
  `updatedAt`
- `api-keys` — `id`, `userId`, `name`, `keyHash`, `scopes`, `expiresAt`,
  `lastUsedAt`, `createdAt`, `revokedAt`
- `auth-sessions` — `id`, `jti`, `userId`, `createdAt`, `expiresAt`

</details>

Existing databases keep their data: the `users` table gains the
`provider`, `externalId`, and `roles` columns, and API keys issued before
version 2 (without an embedded row id) stop validating — rotate them.

## API surface

```ts
import {
  AuthService,        // the service described above
  OidcService,        // standalone OIDC flows
  // JWT
  signSessionToken, verifySessionToken, signWsToken, verifyWsToken,
  // guards and scope logic
  requireAuth, requireRole, requireScopes,
  hasRole, hasAnyRole, hasScopes, scopeMatches, parseScopes,
  // credentials and cookies
  extractCredentials, readCookie, sessionCookie, isSecureRequest,
  // API keys, sessions, passwords
  createApiKey, verifyApiKey, revokeApiKey,
  createSession, revokeSession, hashPassword, verifyPassword,
} from "@dockstat/auth"

import {
  authContext, getAuthUser, requireUser,
  createAuthMiddleware, createRequireAuthMiddleware,
} from "@dockstat/auth/react-router"
```

## Contributing

Install dependencies with `bun install`, keep the Biome checks clean, and
include logging for new server-side features. Submit changes through a
pull request with a clear description.

## License

MPL-2.0 — see the repository root for details.
