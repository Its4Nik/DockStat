import Elysia from "elysia"
import PluginHandlerFactory from "@dockstat/plugin-handler"
import { DockStatDB } from "~/.server/db"
import { Elogger } from "../handlers"

const PluginHandler = new PluginHandlerFactory(DockStatDB._sqliteWrapper, Elogger.getParentsForLoggerChaining())
export const PluginTable = PluginHandler.getTable()

const PluginElysiaInstance = new Elysia({ prefix: '/plugins' })
  .get('/', () => PluginTable.select(['*']).all())

export default PluginElysiaInstance
