import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import Actions from "~/.server/action"
import type { Route } from "./+types/api.auth.api-key"

export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ mode: "json" }),
]

export const action = Actions.Auth.revokeApiKey
