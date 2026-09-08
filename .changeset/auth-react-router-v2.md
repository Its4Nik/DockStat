---
"@dockstat/auth": major
"@dockstat/utils": minor
"@dockstat/widgets": minor
"@dockstat/frontend": minor
---

Rewrite `@dockstat/auth` for React Router v8 and drop the ElysiaJS server

**@dockstat/auth (2.0.0)**

- Replace the ElysiaJS `AuthHandler` (routes, middleware, plugins) with a framework-agnostic `AuthService`. The Elysia routes and the localStorage-based React `AuthProvider`/`ProtectedRoute` client entry points are removed.
- Add `@dockstat/auth/react-router` entry point with SSR-first integration: `createAuthMiddleware` authenticates each request exactly once at the root and publishes the user through router context, and `createRequireAuthMiddleware` guards routes by authentication, role, and scope with browser redirects or JSON 401/403 denials.
- Secure JWT sessions: HS256 tokens with enforced issuer/audience claims, tracked by `jti` in the `auth-sessions` table so every session is revocable. Browser sessions use an HttpOnly `SameSite=Lax` cookie (`Secure` on HTTPS) instead of a readable cookie plus localStorage.
- Sliding sessions: cookie-carried sessions past half their lifetime are transparently re-issued (same `jti`) by the root middleware.
- Add roles and scopes: hierarchical roles (`admin` > `editor` > `viewer`, first registered user becomes admin) persisted on the `users` table, plus wildcard scope matching (`docker:read`, `docker:*`, `*`) with `requireAuth`/`requireRole`/`requireScopes` guard helpers and an `AuthError` carrying the HTTP status.
- API keys now embed their row id (`dockstat_<uuid>_<secret>`), so validation is a single indexed lookup plus one argon2 verify instead of hashing every key in the table. Keys keep scopes, expiry, revocation, and `lastUsedAt` stamping. Pre-2.0 keys must be rotated.
- OIDC login keeps the authorization-code flow with PKCE/state/nonce but moves it behind `OidcService` (`beginLogin`/`completeLogin`/`endSessionUrl`) with discovery caching; OIDC users are upserted into `users` so roles persist across logins.
- Add short-lived WebSocket tokens (separate audience, 60s default) via `AuthService.issueWsToken`/`verifyWsToken` for clients that can't send cookies on the upgrade.
- Credential extraction now lives in one place (`extractCredentials`) with a fixed precedence: `Authorization: Bearer`, `Authorization: Api-Key`, `X-API-Key`, `?token=`, then the session cookie.

**@dockstat/utils**

- `WebSocketProvider` no longer reads a token from localStorage. With `requireAuth`, it fetches a short-lived WS token per connection attempt via the new async `getToken` option (defaults to the `/api/v2/auth/ws-token` endpoint) and appends it as `?token=`.
- The Eden `Client` no longer reads a bearer token from localStorage; tokens are set explicitly via `setToken` and sessions rely on cookies.

**@dockstat/widgets**

- `useWidgetData` evaluation fetch now calls the React Router API surface cookie-authenticated instead of an Eden treaty client tied to the removed Elysia backend.

**@dockstat/frontend**

- Auth endpoints move in-app under `/api/v2/auth/*` as React Router resource routes; the root loader and all guards read the authenticated user from root middleware context instead of re-verifying tokens per loader. The broken `AuthGuard` component and the old `apps/api` Elysia backend are removed.
