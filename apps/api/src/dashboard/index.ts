import { DashboardHandler as DashboardHandlerFactory } from "@dockstat/widget-handler/server"
import { DockStatDB } from "../database"
import BaseLogger from "../logger"

export const DashboardHandler = new DashboardHandlerFactory(DockStatDB._sqliteWrapper, BaseLogger)
