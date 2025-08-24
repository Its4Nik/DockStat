import { type DB, type QueryBuilder, column } from '@dockstat/sqlite-wrapper'
import type { THEME } from '@dockstat/typings'

export default class ThemeHandler {
  private theme_table: QueryBuilder<THEME.THEME_config>

  constructor(DB: DB) {
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

    this.theme_table = DB.table<THEME.THEME_config>('themes')
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
    this.theme_table.where({ active: 1 }).update({ active: 0 })
    return this.theme_table.where({ name: name }).update({ active: 1 })
  }
}
