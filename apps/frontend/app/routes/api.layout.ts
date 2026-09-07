import type { MiddlewareFunction } from "react-router"
import { apiMetricsMiddleware } from "~/.server/middleware/api"

// Auth endpoints handle tokens themselves (OAuth redirects, verify, revoke);
// this layout only records request metrics for the /api/v2/auth subtree.
export const middleware: MiddlewareFunction[] = [apiMetricsMiddleware]
