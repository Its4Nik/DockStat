import { createRequireAuthMiddleware } from "@dockstat/auth/react-router"
import Loaders from "~/.server/loader"
import type { Route } from "./+types/api.auth.users"

export const middleware: Route.MiddlewareFunction[] = [
  createRequireAuthMiddleware({ mode: "json", roles: ["admin"] }),
]

export const loader = Loaders.Auth.getAuthLocalUsers
