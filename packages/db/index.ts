import { DB, type QueryBuilder, column } from '@dockstat/sqlite-wrapper'
import type { DATABASE, THEME } from '@dockstat/typings'
import { darkDockStatTheme } from './default_theme'

class DockStatDB {
  private db: DB
  private config_table: QueryBuilder<DATABASE.DB_config>
  private theme_table: QueryBuilder<THEME.THEME_config>

  constructor() {
    this.db = new DB('dockstat.sqlite')

    // Create config table (stores current theme name)
    this.db.createTable(
      'config',
      {
        id: column.integer({ primaryKey: true, notNull: true }),
        current_theme_name: column.text({ notNull: true, default: 'default' }),
      },
      {
        ifNotExists: true,
        withoutRowId: false,
      }
    )

    // Create themes table
    this.db.createTable(
      'themes',
      {
        name: column.text({ unique: true, notNull: true }),
        version: column.text({ notNull: true }),
        creator: column.text({ notNull: true }),
        license: column.text({ notNull: true }),
        vars: column.text({ notNull: true }), // JSON string
      },
      {
        ifNotExists: true,
        withoutRowId: false,
      }
    )

    // Initialize query builders
    this.config_table = this.db.table('config')
    this.theme_table = this.db.table<THEME.THEME_config>('themes', {
      jsonColumns: ['vars'],
    })

    // Initialize database with defaults if empty
    this.initializeDefaults()
  }

  private initializeDefaults(): void {
    // Initialize config table if empty
    const existingConfig = this.config_table.select(['*']).get()
    if (!existingConfig) {
      this.config_table.insert({
        current_theme_name: 'default',
      })

      // Add default theme if it doesn't exist
      this.addOrUpdateTheme(darkDockStatTheme)
    }
  }

  /**
   * Get the underlying sqlite-wrapper DB instance for integration with docker-client
   */
  public getDB(): DB {
    return this.db
  }

  // Theme Management Methods

  /**
   * Add or update a theme in the themes table
   */
  public addOrUpdateTheme(theme: THEME.THEME_config) {
    const result = this.theme_table.insert(theme, { orReplace: true })

    // Verify insertion by checking raw database
    const rawCheck = this.db
      .table<THEME.THEME_config>('themes')
      .select(['name', 'version'])
      .all()
    console.log(
      `DEBUG addOrUpdateTheme: Raw table now has ${rawCheck.length} themes:`,
      rawCheck.map((t) => t.name)
    )

    return result
  }

  /**
   * Get a theme by name
   */
  public getTheme(themeName: string): THEME.THEME_config | null {
    return this.theme_table.select(['*']).where({ name: themeName }).get()
  }

  /**
   * Get all themes
   */
  public getThemes(): THEME.THEME_config[] {
    return this.theme_table.select(['*']).all()
  }

  /**
   * Set the current theme (updates config to use this theme)
   */
  public setTheme(themeName: string) {
    const theme = this.getTheme(themeName)
    if (theme) {
      // Update the current theme in config table
      this.config_table.where({}).update({ current_theme_name: themeName })
      return theme
    }
    return null
  }

  /**
   * Get the currently active theme
   */
  public getCurrentTheme(): THEME.THEME_config {
    const config = this.config_table.select(['current_theme_name']).get()
    if (config) {
      const theme = this.getTheme(config.current_theme_name)
      if (theme) {
        return theme
      }
    }
    return darkDockStatTheme
  }

  /**
   * Get the current theme name
   */
  public getCurrentThemeName(): string {
    const config = this.config_table.select(['current_theme_name']).get()
    return config?.current_theme_name || 'default'
  }

  // Database Management

  /**
   * Close the database connection
   */
  public close(): void {
    this.db.close()
  }

  /**
   * Execute a raw SQL query (for advanced use cases)
   */
  public exec(sql: string): void {
    this.db.exec(sql)
  }

  /**
   * Get database schema information
   */
  public getSchema(): unknown {
    return this.db.getSchema()
  }

  /**
   * Get database file path
   */
  public getDatabasePath(): string {
    return 'dockstat.sqlite'
  }
}

export default DockStatDB
