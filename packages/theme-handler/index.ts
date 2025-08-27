import { createLogger } from '@dockstat/logger'
import { type DB, type QueryBuilder, column } from '@dockstat/sqlite-wrapper'
import type { THEME } from '@dockstat/typings'
import { darkDockStatTheme } from './defaultTheme'

export default class ThemeHandler {
  private theme_table: QueryBuilder<THEME.THEME_config>
  private logger = createLogger('ThemeHandler')

  constructor(DB: DB) {
    try {
      this.logger.info('Initializing ThemeHandler')
      this.logger.debug(`Creating themes table on ${DB.getDb().filename}`)
    } catch (error) {
      console.error(`Failed to initialize ThemeHandler: ${error}`)
    }
    DB.createTable(
      'themes',
      {
        name: column.text({ notNull: true, unique: true, primaryKey: true }),
        version: column.text({ notNull: true }),
        creator: column.text({ notNull: true }),
        license: column.text({ notNull: true }),
        description: column.text({ notNull: true }),
        active: column.boolean({ notNull: true, default: 0 }),
        vars: column.json({ validateJson: true, notNull: true }),
      },
      { ifNotExists: true }
    )

    this.theme_table = DB.table<THEME.THEME_config>('themes', {jsonColumns: ['vars']})
    this.logger.debug('Inserting default theme')
    const changes = this.theme_table.insertOrReplace(darkDockStatTheme)
    this.logger.debug(`Inserted ${changes.changes} rows at ${changes.insertId}`)
  }

  public addTheme(theme: THEME.THEME_config) {
    return this.theme_table.insert(theme)
  }

  public getTheme(name: string) {
    return this.theme_table.select(['*']).where({ name: name }).first()
  }

  public getActiveTheme() {
    return this.theme_table.select(['*']).where({ active: 1 }).first()
  }

  public setActiveTheme(name: string) {
    this.logger.debug('Setting previous active theme to inactive' )
    const out1=this.theme_table.where({ active: 1 }).update({ active: 0 })
    this.logger.debug(`Set ${name} to active=1: ${JSON.stringify(out1)}`)
    const out2 = this.theme_table.where({ name: name }).update({ active: 1 })
    this.logger.debug(`Changes: ${JSON.stringify(out2)}`)
    return out2;
  }

  public getAllThemes() {
    return this.theme_table.select(['*']).all()
  }

  public getThemeNames() {
    return this.theme_table
      .select(['name'])
      .all()
      .map((theme) => theme.name)
  }

  public deleteTheme(name: string) {
    return this.theme_table.where({ name: name }).delete()
  }

  public updateTheme(name: string, updates: Partial<THEME.THEME_config>) {
    return this.theme_table.where({ name: name }).update(updates)
  }

  public themeExists(name: string): boolean {
    const theme = this.theme_table
      .select(['name'])
      .where({ name: name })
      .first()
    return !!theme
  }
}
