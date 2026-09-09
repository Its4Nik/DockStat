import { layout, type RouteConfig, route } from "@react-router/dev/routes"
import GenRoutes from "./routes/gen"
export default [
  ...GenRoutes,
  route("login", "routes/login.tsx"),

  // Protected routes
  layout("routes/layout.tsx", [
    route("home", "routes/home.tsx"),
  ]),


  // Global API routes
  route("api/v3/", "routes/api.tsx", [
    layout("routes/api.secure.tsx", [
    ]),

    route("metrics", "routes/metrics.ts"),
    route("auth/providers", "routes/api.auth.providers.tsx"),
    route("auth/providers/:providerId", "routes/api.auth.provider.tsx"),
    route("auth/local/login", "routes/api.auth.local-login.tsx"),
    route("auth/local/register", "routes/api.auth.local-register.tsx"),
    route("auth/local/logout", "routes/api.auth.local-logout.tsx"),
    route("auth/local/exists", "routes/api.auth.local-exists.tsx"),
    route("auth/local/allow-guest", "routes/api.auth.local-allow-guest.tsx"),
    route("auth/guest/:allow", "routes/api.auth.guest.tsx"),
    route("auth/verify", "routes/api.auth.verify.tsx"),
    route("auth/revoke", "routes/api.auth.revoke.tsx"),
    route("auth/ws-token", "routes/api.auth.ws-token.tsx"),
    route("auth/users", "routes/api.auth.users.tsx"),
    route("auth/users/:userId", "routes/api.auth.user.tsx"),
    route("auth/api-keys", "routes/api.auth.api-keys.tsx"),
    route("auth/api-keys/:id", "routes/api.auth.api-key.tsx"),
    route("auth/:providerId/login", "routes/api.auth.oidc-login.tsx"),
    route("auth/:providerId/callback", "routes/api.auth.oidc-callback.tsx"),
    route("auth/:providerId/logout", "routes/api.auth.oidc-logout.tsx"),
  ]),

  // Auth API (external OIDC redirects, tokens, API-key management)
] satisfies RouteConfig
