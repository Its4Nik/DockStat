import PluginHandlerFactory from "@dockstat/plugin-handler"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"

const PluginHandler = new PluginHandlerFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger.spawn("PluginHandler")
)

await PluginHandler.loadAllPlugins()

export { PluginHandler }
