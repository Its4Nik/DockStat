import { index, type RouteConfig, route, layout} from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),

  // Protected routes
  layout("routes/layout.tsx", [
route("home", "routes/home.tsx", )
  ]),

  route("metrics", "routes/metrics.ts"),
] satisfies RouteConfig
