import { type RouteConfig, route } from "@react-router/dev/routes"
//import { flatRoutes } from "@react-router/fs-routes";

export default [
  route("/", "./routes/index.tsx"),
  route("/onboarding", "./routes/onboarding.tsx"),
  route("/clients", "./routes/clients.tsx"),
  // Plugin frontend pages - catch-all route for plugin templates
  route("/p/:pluginId/*", "./routes/plugin-page.tsx"),
] satisfies RouteConfig
