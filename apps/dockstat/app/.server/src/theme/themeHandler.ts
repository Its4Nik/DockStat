import { createLogger } from "@dockstat/logger";
import type DB from "@dockstat/sqlite-wrapper";
import type { THEME } from "@dockstat/typings";
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import { injectVariables } from "~/.server/src/utils";

class ThemeHandler {
  private DB: DB;
  private logger = createLogger("ThemeHandler")
  private themes: QueryBuilder<THEME.ThemeTable>;

  constructor(db: DB) {
    this.logger.info("Setting up ThemeHandler")
    this.DB = db

    this.logger.debug("Creating 'themes' table in DB");
    this.themes = this.DB.createTable<THEME.ThemeTable>("themes", {
      name: column.text({ notNull: true, primaryKey: true, unique: true }),
      creator: column.text({ notNull: true }),
      license: column.text({ notNull: true }),
      vars: column.json({ notNull: true }),
      config: column.json({ notNull: true })
    }, { ifNotExists: true })
    this.logger.debug("Theme table created and assigned");
    this.logger.info("ThemeHandler setup complete");
  }

  getThemeTable() {
    return this.themes
  }

  getAll() {
    return this.themes.select(["*"]).all()
  }

  registerTheme(theme: THEME.ThemeTable) {
    this.logger.info(`Registering theme: ${theme.name}`);
    this.logger.debug(`Theme details: ${JSON.stringify(theme)}`);
    try {
      const result = this.themes.insertOrReplace(theme)
      this.logger.info(`Theme "${theme.name}" registered/updated`);
      return result;
    } catch (err) {
      this.logger.error(`Failed to register theme "${theme.name}": ${err}`);
      throw err;
    }
  }

  unregisterTheme(themeName: string) {
    this.logger.info(`Unregistering theme: ${themeName}`);
    try {
      const result = this.themes.where({ name: themeName }).delete()
      this.logger.info(`Theme "${themeName}" unregistered`);
      return result;
    } catch (err) {
      this.logger.error(`Failed to unregister theme "${themeName}": ${err}`);
      throw err;
    }
  }

  getThemeByName(themeName: string) {
    this.logger.debug(`Getting theme by name: ${themeName}`);
    return this.themes.where({ name: themeName }).first()
  }

  getThemeByCreator(themeCreator: string) {
    this.logger.debug(`Getting themes by creator: ${themeCreator}`);
    return this.themes.select(["*"]).where({ creator: themeCreator }).all()
  }

  activateTheme(themeName: string, docRoot: HTMLElement) {
    this.logger.info(`Activating theme: ${themeName}`);
    const theme = this.getThemeByName(themeName)

    if (!theme) {
      this.logger.error(`No theme found for name: ${themeName}`);
      return { success: false };
    }

    try {
      this.logger.debug(`Injecting theme variables for "${themeName}"`);
      injectVariables(theme.vars, docRoot)
      this.logger.info(`Theme "${themeName}" activated`);
    } catch (error: unknown) {
      this.logger.error(`Error injecting theme variables: ${error as string}`);
      throw new Error(error as string)
    }

    return { success: true }
  }
}

export default ThemeHandler
