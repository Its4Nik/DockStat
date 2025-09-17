import { createLogger } from "@dockstat/logger";
import type DB from "@dockstat/sqlite-wrapper";
import type { THEME } from "@dockstat/typings";
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import { injectVariables } from "../utils";

class ThemeHandler {
  private DB: DB;
  private logger = createLogger("ThemeHandler")
  private docRoot: HTMLElement;
  private themes: QueryBuilder<THEME.ThemeTable>;

  constructor(db: DB, docRoot: HTMLElement){
    this.logger.info("Setting up ThemeHandler")
    this.DB = db

    this.DB.createTable("themes",{
        name: column.text({notNull: true, primaryKey: true, unique: true}),
        creator: column.text({notNull: true}),
        license: column.text({notNull: true}),
        vars: column.json({notNull: true}),
    },{ifNotExists: true})

    this.themes = this.DB.table<THEME.ThemeTable>("themes")

    this.docRoot = docRoot
  }

  registerTheme(theme: THEME.ThemeTable){
    return this.themes.insertOrReplace(theme)
  }

  unregisterTheme(themeName: string){
    return this.themes.where({name: themeName}).delete()
  }

  getThemeByName(themeName: string){
    return this.themes.where({name: themeName}).first()
  }

  getThemeByCreator(themeCreator: string){
    return this.themes.select(["*"]).where({creator: themeCreator}).all()
  }

  activateTheme(themeName: string, docRoot = this.docRoot){
    const theme = this.getThemeByName(themeName)

    if(!theme){
      this.logger.error(`No theme found for name: ${theme}`)
      return { success: false };
    }

    try {
    injectVariables(theme.vars, docRoot)
    } catch (error: unknown){
      this.logger.error(error as string)
      throw new Error(error as string)
    }

  return { success: true }
  }
}

export default ThemeHandler
