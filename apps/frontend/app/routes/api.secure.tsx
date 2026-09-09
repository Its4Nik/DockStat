import { Outlet } from "react-router"
import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import type { Route } from "./+types/api.secure"

export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ loginPath: "/login", mode: "json" }),
]

export default function ApiAuthLayout() {
  return <Outlet />
}
