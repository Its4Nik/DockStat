import { index, type RouteConfig, route, layout} from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),

  layout("routes/layout.tsx", [

  ]),

  // HTTP surface kept for flows that cannot go through loaders/actions:
  // OIDC redirects, the SPA login bridge and Prometheus scraping.
  route("api/v2/auth", "routes/api.layout.ts", [
    route(":providerId/login", "routes/api.auth.$providerId.login.ts"),
    route(":providerId/callback", "routes/api.auth.$providerId.callback.ts"),
    route(":providerId/logout", "routes/api.auth.$providerId.logout.ts"),
    route("local/login", "routes/api.auth.local.login.ts"),
    route("local/logout", "routes/api.auth.local.logout.ts"),
    route("local/exists", "routes/api.auth.local.exists.ts"),
    route("local/allow-guest", "routes/api.auth.local.allow-guest.ts"),
    route("local/register", "routes/api.auth.local.register.ts"),
    route("verify", "routes/api.auth.verify.ts"),
    route("revoke", "routes/api.auth.revoke.ts"),
  ]),
  route("metrics", "routes/metrics.ts"),
] satisfies RouteConfig
