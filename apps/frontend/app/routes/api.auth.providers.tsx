import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import Actions from "~/.server/action"
import Loaders from "~/.server/loader"
import type { Route } from "./+types/api.auth.providers"

/** Managing OIDC providers is admin-only. */
export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ mode: "json", roles: ["admin"] }),
]

export const loader = Loaders.Auth.getAuthProviders
export const action = Actions.Auth.createProvider
