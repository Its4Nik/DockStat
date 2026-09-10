import { layout, type RouteConfig, route } from "@react-router/dev/routes"
import GenRoutes from "./routes/gen"

export default [
  route("login", "routes/login.tsx"),

  // Protected routes
  layout("routes/layout.tsx", [
    route("home", "routes/home.tsx"),
  ]),

  // Global API routes — public + secure groups generated from `Schemas`
  ...GenRoutes,
] satisfies RouteConfig
