import { createThemeHandler } from "@dockstat/theme-handler/server"
import { DockStatDB } from "../database"
import BaseLogger from "../logger"

const ThemeLogger = BaseLogger.spawn("ThemeHandler")

const themeHandler = createThemeHandler({
  db: DockStatDB._sqliteWrapper,
  logger: ThemeLogger,
})

const ThemeRoutes = themeHandler.getRoutes()

export default ThemeRoutes
