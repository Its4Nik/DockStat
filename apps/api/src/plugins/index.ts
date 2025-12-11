import PluginHandlerFactory from "@dockstat/plugin-handler"
import { DockStatDB } from "../database"
import BaseLogger from "../logger"
import { saveDefaultPlugins } from "./utils/saveDefaultPlugins"

const PluginHandler = new PluginHandlerFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger.getParentsForLoggerChaining()
)

await saveDefaultPlugins(PluginHandler)

export default PluginHandler
