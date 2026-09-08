import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import { Outlet } from "react-router"
import type { Route } from "./+types/layout"

/**
 * Protected layout: every route nested here requires an authenticated
 * session. Unauthenticated document requests redirect to /login; API-ish
 * requests (JSON accept header or /api paths) get a 401 JSON body.
 */
export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ loginPath: "/login" }),
]

export default function Layout() {
  return <Outlet />
}
