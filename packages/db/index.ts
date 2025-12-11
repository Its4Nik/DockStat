import Logger from "@dockstat/logger"
import { DB, type QueryBuilder, column, addLoggerParents } from "@dockstat/sqlite-wrapper"
import type { DockStatConfigTableType } from "@dockstat/typings/types"

class DockStatDB {
  protected db: DB
  private config_table: QueryBuilder<DockStatConfigTableType>
  private metrics_table
  private logger: Logger

  constructor(prefix = "DockStatDB", parents: string[] = []) {
    this.logger = new Logger(prefix, parents)
    addLoggerParents([prefix, ...parents])
    this.logger.info("Initializing DockStatDB")

    try {
      this.db = new DB("dockstat.sqlite", {
        pragmas: [
          ["journal_mode", "WAL"],
          ["cache_size", -64000],
        ],
      })
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
          tls_certs_and_keys: column.json({ notNull: true }),
          registered_repos: column.json({ notNull: true }),
          version: column.text({ notNull: true }),
          hotkeys: column.json(),
          nav_links: column.json(),
          autostart_handlers_monitoring: column.boolean({ default: true }),
        },
        {
          constraints: {
            primaryKey: ["id"],
          },
          ifNotExists: true,
          parser: {
            JSON: [
              "registered_repos",
              "default_themes",
              "tables",
              "tls_certs_and_keys",
              "hotkeys",
              "nav_links",
            ],
            BOOLEAN: ["allow_untrusted_repo", "autostart_handlers_monitoring"],
          },
        }
      )
      this.logger.debug("Config table successfully initialized")

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

    const defaultConfig: DockStatConfigTableType = {
      id: 0,
      name: "DockStat",
      version: "1.0.0",
      allow_untrusted_repo: false,
      default_themes: {
        // Themes will be split in dark and white packs => each their own array, and 0 has to be dockstat default
        dark: 0,
        light: 0,
      },
      hotkeys: {},
      nav_links: [],
      registered_repos: [
        {
          name: "DockStore",
          source: "its4nik/dockstat:dev/apps/dockstore",
          type: "github",
          // verification is not implemented yet :(
          isVerified: true,
          policy: "strict",
          verification_api: "https://api.itsnik.de/dockstacks/_verify",
          hashes: null,
        },
      ],
      autostart_handlers_monitoring: true,
      config_database_rev: "v1.0.0",
      tables: [],
      tls_certs_and_keys: { web: null, docker: null },
    }

    try {
      this.config_table.where({ id: 0 }).insertOrFail(defaultConfig)
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
