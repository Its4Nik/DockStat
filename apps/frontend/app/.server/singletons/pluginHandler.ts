import PluginHandlerFactory from "@dockstat/plugin-handler"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"

const PluginServicesLogger = BaseLogger.spawn("PluginHandler")

const PluginHandler = new PluginHandlerFactory(
  DockStatDB._sqliteWrapper,
  PluginServicesLogger
)

PluginServicesLogger.info("Plugin handler initializing plugin load")
await PluginHandler.loadAllPlugins()
PluginServicesLogger.info("Plugin handler finished loading plugins")

export { PluginHandler }
