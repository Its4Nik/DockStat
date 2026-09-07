import { AuthHandler as AuthHandlerFactory } from "@dockstat/auth"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"

const stateMap = new WeakMap<Request, { startTime: number; reqId: string }>()

const getAllowGuest: () => boolean = () =>
  DockStatDB.configTable.select(["additionalSettings"]).first()?.additionalSettings
    .enableRegistration || false

const AuthHandler = new AuthHandlerFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger,
  () => stateMap,
  getAllowGuest()
)

export const Auth = {
  getAllowGuest: getAllowGuest,
  getStateMap: () => stateMap,
  Handler: AuthHandler,
}
