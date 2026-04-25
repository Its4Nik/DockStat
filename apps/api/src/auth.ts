import { AuthHandler as AuthHandlerFactory } from "@dockstat/auth"
import { DockStatDB } from "./database"
import { stateMap } from "./handlers/requestLogger"
import BaseLogger from "./logger"

const allowGuest = DockStatDB.configTable.select(["additionalSettings"]).first()
  ?.additionalSettings.enableRegistration

export const AuthHandler = new AuthHandlerFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger,
  () => stateMap,
  allowGuest
)
export const Middleware = AuthHandler.middleware.createAuthMiddleware(() => stateMap)
export const authenticated = AuthHandler.middleware.authenticated
