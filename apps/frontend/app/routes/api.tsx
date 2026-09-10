import { apiMetricsMiddleware } from "~/.server/middleware/api"
import type { Route } from "./+types/api"

export const middleware: Route.MiddlewareFunction[] = [apiMetricsMiddleware]
