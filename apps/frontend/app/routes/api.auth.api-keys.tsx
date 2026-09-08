import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import Actions from "~/.server/action"
import Loaders from "~/.server/loader"
import type { Route } from "./+types/api.auth.api-keys"

export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ mode: "json" }),
]

export const loader = Loaders.Auth.getApiKeys
export const action = Actions.Auth.createApiKey
