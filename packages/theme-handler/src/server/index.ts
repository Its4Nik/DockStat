import type Logger from "@dockstat/logger"
import type DB from "@dockstat/sqlite-wrapper"
import { createThemeRoutes } from "./api"
import { ThemeDB } from "./db"
import type { themeType } from "./types"

export type { ThemeRoutesType } from "./api"
export { createThemeRoutes } from "./api"
export { ThemeDB } from "./db"
export type { themeType } from "./types"

export type ThemeHandlerConfig = {
  db: DB
  logger: Logger
}

export class ThemeHandler {
  private readonly logger: Logger
  private readonly themeDB: ThemeDB

  constructor(config: ThemeHandlerConfig) {
    const { db, logger } = config

    this.logger = logger
    this.themeDB = new ThemeDB(db, logger)

    this.logger.debug("@dockstat/theme-handler: ThemeHandler initialised")
  }

  /**
   * Access to the underlying ThemeDB instance
   * so callers can manage themes (CRUD) as needed.
   */
  getThemeDB(): ThemeDB {
    return this.themeDB
  }

  /**
   * Convenience wrapper for fetching a theme.
   */
  getTheme(params: { name?: string; id?: number }): themeType | null {
    const { name, id } = params

    if (!name && !id) {
      this.logger.error("ThemeHandler.getTheme called without name or id")
      return null
    }

    try {
      const theme = this.themeDB.getTheme(name, id)
      if (!theme) {
        this.logger.warn(
          `ThemeHandler.getTheme: theme not found (${name ? `name=${name}` : ""}${
            name && id ? ", " : ""
          }${id ? `id=${id}` : ""})`
        )
      }
      return theme
    } catch (error) {
      this.logger.error(`ThemeHandler.getTheme: failed to fetch theme ${error}`)
      return null
    }
  }

  /**
   * Returns the Elysia route group so the caller can `.use(handler.getRoutes())`
   * on their server instance.
   *
   * The routes are created with access to the ThemeDB instance.
   */
  getRoutes() {
    return createThemeRoutes(this.themeDB)
  }
}

/**
 * Factory helper for creating a ThemeHandler.
 * This keeps the public API small and avoids `new` in userland if desired.
 */
export const createThemeHandler = (config: ThemeHandlerConfig): ThemeHandler => {
  return new ThemeHandler(config)
}
