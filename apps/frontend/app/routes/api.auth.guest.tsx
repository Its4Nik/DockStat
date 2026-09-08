import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import Actions from "~/.server/action"
import type { Route } from "./+types/api.auth.guest"

export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ mode: "json", roles: ["admin"] }),
]

export const action = Actions.Auth.toggleGuestRegistration
