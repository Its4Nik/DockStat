import { AuthHandler as AuthHandlerFactory,createAuthMiddleware } from "@dockstat/auth"
import { DockStatDB } from "./database"

import BaseLogger from "./logger"

export const AuthHandler = new AuthHandlerFactory(DockStatDB._sqliteWrapper, BaseLogger)
export const AuthMiddleware = createAuthMiddleware()
