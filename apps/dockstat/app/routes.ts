import { type RouteConfig, route } from "@react-router/dev/routes"
//import { flatRoutes } from "@react-router/fs-routes";

export default [
  route("/", "./routes/index.tsx"),
  route("/onboarding", "./routes/onboarding.tsx"),
] satisfies RouteConfig
