import Loaders from "~/.server/loader"
import { authGuardMiddleware } from "~/.server/middleware/api"
import type { Route } from "./+types/api.auth.ws-token"

/**
 * Exchanges an authenticated session (cookie/Bearer) for a short-lived WS
 * token. WebSocket clients that can't send cookies — cross-origin or
 * cross-port — call this first, then connect with `?token=`.
 */
export const middleware: Route.MiddlewareFunction[] = [authGuardMiddleware]

export const loader = Loaders.Auth.wsToken
