import { Outlet } from "react-router"
import { apiMetricsMiddleware } from "~/.server/middleware/api"
import type { Route } from "./+types/api.auth"

/**
 * `/api/v2/auth` — shared layout for the auth resource routes.
 * Records request metrics like the rest of the API surface.
 */
export const middleware: Route.MiddlewareFunction[] = [apiMetricsMiddleware]

export default function ApiAuthLayout() {
  return <Outlet />
}
