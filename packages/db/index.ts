import { createLogger } from '@dockstat/logger'
import { DB, type QueryBuilder, column } from '@dockstat/sqlite-wrapper'
import type { DATABASE, THEME } from '@dockstat/typings'

const logger = createLogger('DockStatDB')

class DockStatDB {
  private db: DB
  private config_table: QueryBuilder<DATABASE.DB_config>

  constructor() {
    logger.info('Initializing DockStatDB')

    try {
      this.db = new DB('dockstat.sqlite')
      logger.debug('Created DB instance for dockstat.sqlite')

      // Create config table (stores current theme name)
      logger.debug('Creating config table')
      this.db.createTable(
        'config',
        {
          id: column.integer({ primaryKey: true, notNull: true }),
          default_theme: column.text({
            notNull: true,
            default: 'default',
          }),
          hotkeys: column.json({notNull: true})
        },
        {
          ifNotExists: true,
          withoutRowId: false,
        }
      )
      logger.debug('Config table created successfully')

      // Initialize query builders
      this.config_table = this.db.table('config', {jsonColumns: ["hotkeys"]})
      logger.debug('Query builders initialized')

      // Initialize database with defaults if empty
      this.initializeDefaults()
    } catch (error) {
      logger.error(`Failed to initialize database: ${error}`)
      throw error
    }
  }

  private initializeDefaults(): void {
    logger.debug('Checking if database needs initialization with defaults')
    try {
      // Initialize config table if empty
      const existingConfig = this.config_table.select(['*']).get()
      if (!existingConfig) {
        logger.info('No existing config found, initializing with defaults')
        this.config_table.insert({
          default_theme: 'default',
          hotkeys: {}
        })
        logger.debug('Default config inserted')
      } else {
        logger.debug('Database already initialized, skipping defaults')
      }
    } catch (error) {
      logger.error(`Failed to initialize defaults: ${error}`)
      throw error
    }
  }

  /**
   * Get the underlying sqlite-wrapper DB instance for integration with docker-client
   */
  public getDB(): DB {
    logger.debug('Getting DB instance')
    return this.db
  }

  public getConfigTable(){
    return this.config_table
  }

  // Database Management

  /**
   * Close the database connection
   */
  public close(): void {
    logger.info('Closing database connection')
    try {
      this.db.close()
      logger.debug('Database connection closed successfully')
    } catch (error) {
      logger.error(`Failed to close database connection: ${error}`)
      throw error
    }
  }

  /**
   * Execute a raw SQL query (for advanced use cases)
   */
  public exec(sql: string): void {
    logger.debug(`Executing raw SQL: ${sql}`)
    try {
      this.db.run(sql)
      logger.debug('SQL executed successfully')
    } catch (error) {
      logger.error(`Failed to execute SQL: ${error}`)
      throw error
    }
  }

  /**
   * Get database schema information
   */
  public getSchema(): unknown {
    logger.debug('Getting database schema')
    try {
      const schema = this.db.getSchema()
      logger.debug('Schema retrieved successfully')
      return schema
    } catch (error) {
      logger.error(`Failed to get database schema: ${error}`)
      throw error
    }
  }

  /**
   * Get database file path
   */
  public getDatabasePath(): string {
    return 'dockstat.sqlite'
  }
}

export default DockStatDB
