import { AuthHandler as AuthHandlerFactory } from "@dockstat/auth"
import { DockStatDB } from "./database"
import { stateMap } from "./handlers/requestLogger"
import BaseLogger from "./logger"

export const AuthHandler = new AuthHandlerFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger,
  () => stateMap
)
export const Middleware = AuthHandler.middleware.createAuthMiddleware(() => stateMap)
export const authenticated = AuthHandler.middleware.authenticated
