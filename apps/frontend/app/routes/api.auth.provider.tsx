import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import Actions from "~/.server/action"
import type { Route } from "./+types/api.auth.provider"

export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ mode: "json", roles: ["admin"] }),
]

export const action = Actions.Auth.deleteProvider
