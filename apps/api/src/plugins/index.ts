import PluginHandlerFactory from "@dockstat/plugin-handler"
import { DockStatDB } from "../database"
import BaseLogger from "../logger"

const PluginHandler = new PluginHandlerFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger.getParentsForLoggerChaining()
)

export default PluginHandler
