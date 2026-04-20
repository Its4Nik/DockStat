import { AuthHandler as AuthHandlerFactory } from "@dockstat/auth"
import { DockStatDB } from "./database"
import BaseLogger from "./logger"

export const AuthHandler = new AuthHandlerFactory(DockStatDB._sqliteWrapper, BaseLogger)
