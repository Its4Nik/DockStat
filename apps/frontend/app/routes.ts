import { layout, type RouteConfig, route } from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),

  // Protected routes
  layout("routes/layout.tsx", [route("home", "routes/home.tsx")]),

  route("metrics", "routes/metrics.ts"),

  // Auth API (external OIDC redirects, tokens, API-key management)
  route("api/v2/auth", "routes/api.auth.tsx", [
    route("providers", "routes/api.auth.providers.tsx"),
    route("providers/:providerId", "routes/api.auth.provider.tsx"),
    route("local/login", "routes/api.auth.local-login.tsx"),
    route("local/register", "routes/api.auth.local-register.tsx"),
    route("local/logout", "routes/api.auth.local-logout.tsx"),
    route("local/exists", "routes/api.auth.local-exists.tsx"),
    route("local/allow-guest", "routes/api.auth.local-allow-guest.tsx"),
    route("guest/:allow", "routes/api.auth.guest.tsx"),
    route("verify", "routes/api.auth.verify.tsx"),
    route("revoke", "routes/api.auth.revoke.tsx"),
    route("ws-token", "routes/api.auth.ws-token.tsx"),
    route("users", "routes/api.auth.users.tsx"),
    route("users/:userId", "routes/api.auth.user.tsx"),
    route("api-keys", "routes/api.auth.api-keys.tsx"),
    route("api-keys/:id", "routes/api.auth.api-key.tsx"),
    route(":providerId/login", "routes/api.auth.oidc-login.tsx"),
    route(":providerId/callback", "routes/api.auth.oidc-callback.tsx"),
    route(":providerId/logout", "routes/api.auth.oidc-logout.tsx"),
  ]),
] satisfies RouteConfig
