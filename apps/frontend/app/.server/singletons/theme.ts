import { createThemeHandler } from "@dockstat/theme-handler/server";
import { BaseLogger } from "../logger";
import { DockStatDB } from "./db";

const ThemeHandler = createThemeHandler({db: DockStatDB._sqliteWrapper, logger: BaseLogger.spawn("TH")})

export { ThemeHandler }
