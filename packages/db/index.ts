import type Logger from "@dockstat/logger"
import { column, DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockStatConfigTableType, RepoType } from "@dockstat/typings/types"
import { defaultConfig, defaultRepositories } from "./defaults"

class DockStatDB {
  protected db: DB
  private config_table: QueryBuilder<DockStatConfigTableType>
  private repositories_table: QueryBuilder<RepoType>
  private metrics_table
  private logger: Logger

  constructor(prefix = "DockStatDB", baseLogger: Logger) {
    this.logger = baseLogger.spawn(prefix)
    this.logger.info("Initializing DockStatDB")

    try {
      this.db = new DB(
        "dockstat.sqlite",
        {
          pragmas: [
            ["journal_mode", "WAL"],
            ["cache_size", -64000],
          ],
          autoBackup: {
            directory: ".backups",
            enabled: true,
            compress: true,
            intervalMs: Bun.env.DOCKSTAT_DB_BACKUP_INTERVAL
              ? Number(Bun.env.DOCKSTAT_DB_BACKUP_INTERVAL) * 60 * 1000
              : undefined,
            maxBackups: Number(Bun.env.DOCKSTAT_MAX_DB_BACKUPS || 10),
          },
        },
        this.logger
      )
      this.logger.debug("Created DB instance for dockstat.sqlite")

      this.config_table = this.db.createTable<DockStatConfigTableType>(
        "config",
        {
          name: column.text({ notNull: false }),
          id: column.uuid(),
          config_database_rev: column.text(),
          allow_untrusted_repo: column.boolean({ default: false }),
          default_themes: column.json({ notNull: true }),
          tables: column.json({ notNull: true }),
          keys: column.json({ notNull: true }),
          version: column.text({ notNull: true }),
          hotkeys: column.json(),
          nav_links: column.json(),
          autostart_handlers_monitoring: column.boolean({ default: true }),
          additionalSettings: column.json(),
        },
        {
          constraints: {
            primaryKey: ["id"],
          },
          ifNotExists: true,
          parser: {
            JSON: [
              "default_themes",
              "tables",
              "keys",
              "hotkeys",
              "nav_links",
              "additionalSettings",
            ],
            BOOLEAN: ["allow_untrusted_repo", "autostart_handlers_monitoring"],
          },
        }
      )
      this.logger.debug("Config table successfully initialized")

      this.repositories_table = this.db.createTable<RepoType>(
        "repositories",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          type: column.text({ notNull: true }),
          source: column.text({ notNull: true }),
          policy: column.text({ notNull: true, default: "relaxed" }),
          paths: column.json(),
          verification_api: column.text({ notNull: false }),
        },
        {
          ifNotExists: true,
        }
      )
      this.logger.debug("Repositories table successfully initialized")

      this.metrics_table = this.db.createTable(
        "metrics",
        {
          id: column.id(),
          totalRequests: column.integer(),
          requestsByMethod: column.json(),
          requestsByPath: column.json(),
          requestsByStatus: column.json(),
          requestDurations: column.json(),
          errors: column.integer(),
        },
        {
          ifNotExists: true,
          parser: {
            JSON: ["requestsByMethod", "requestsByPath", "requestsByStatus", "requestDurations"],
          },
        }
      )

      this.logger.debug("Metrics table successfully initialized")

      // Initializing periodic tasks
      this.initializePeriodicTasks()

      // Initialize database with defaults if empty
      this.initializeDefaults()
    } catch (error) {
      this.logger.error(`Failed to initialize database: ${error}`)
      throw error
    }
  }

  private initializePeriodicTasks() {
    this.logger.debug("Initializing periodic tasks")

    this.db.vacuum()
  }

  private initializeDefaults(): void {
    this.logger.debug("Checking if database needs initialization with defaults")

    try {
      this.config_table.where({ id: 0 }).insertOrIgnore(defaultConfig)
      this.logger.debug("Default config inserted")
    } catch (error: unknown) {
      this.logger.error(`Failed to initialize defaults: ${error}`)

      this.logger.info("Checking if migration is needed")
      const config = this.config_table.select(["*"]).all()
      if (config.length === 0) {
        this.logger.error(
          "No config found (After initialization) => Aborting, please check your database!"
        )
        process.exit()
      }
      if (config.length > 1) {
        this.logger.error(
          "Multiple configs found (After initialization) => Aborting, please check your database!"
        )
        process.exit()
      }
      if (config.length === 1) {
        this.logger.info("Config found, continuing")
        switch (
          Bun.semver.order(config[0].config_database_rev, defaultConfig.config_database_rev)
        ) {
          case -1:
            this.logger.info(
              "Database version is older than the default version => Version update detected!"
            )
            this.db.dropTable("config")
            this.initializeDefaults()
            break

          case 1:
            this.logger.error(
              "Database version is newer than the default version => Aborting, please check your database!"
            )
            process.exit()
            break
          case 0:
            this.logger.info("Database version is up to date")
            break
        }
      }
    }

    // Initialize default repositories if none exist
    this.initializeDefaultRepositories()
  }

  private initializeDefaultRepositories(): void {
    this.logger.debug("Checking if default repositories need to be initialized")

    const existingRepos = this.repositories_table.select(["*"]).all()
    if (existingRepos.length === 0) {
      this.logger.info("No repositories found, inserting defaults")
      for (const repo of defaultRepositories) {
        try {
          this.repositories_table.insert(repo)
          this.logger.debug(`Inserted default repository: ${repo.name}`)
        } catch (error) {
          this.logger.error(`Failed to insert default repository ${repo.name}: ${error}`)
        }
      }
    } else {
      this.logger.debug(`Found ${existingRepos.length} existing repositories`)
    }
  }

  /**
   * Get the underlying sqlite-wrapper DB instance for integration with docker-client
   */
  public getDB(): DB {
    this.logger.debug("Getting DB instance")
    return this.db
  }

  public getConfigTable() {
    return this.config_table
  }

  public getRepositoriesTable() {
    return this.repositories_table
  }

  public getMetricsTable() {
    return this.metrics_table
  }

  // Database Management

  /**
   * Close the database connection
   */
  public close(): void {
    this.logger.info("Closing database connection")
    try {
      this.db.close()
      this.logger.debug("Database connection closed successfully")
    } catch (error) {
      this.logger.error(`Failed to close database connection: ${error}`)
      throw error
    }
  }

  /**
   * Execute a raw SQL query (for advanced use cases)
   */
  public exec(sql: string): void {
    this.logger.debug(`Executing raw SQL: ${sql}`)
    try {
      this.db.run(sql)
      this.logger.debug("SQL executed successfully")
    } catch (error) {
      this.logger.error(`Failed to execute SQL: ${error}`)
      throw error
    }
  }

  /**
   * Get database schema information
   */
  public getSchema(): unknown {
    this.logger.debug("Getting database schema")
    try {
      const schema = this.db.getSchema()
      this.logger.debug("Schema retrieved successfully")
      return schema
    } catch (error) {
      this.logger.error(`Failed to get database schema: ${error}`)
      throw error
    }
  }

  /**
   * Get database file path
   */
  public getDatabasePath(): string {
    return "dockstat.sqlite"
  }
}

export default DockStatDB
