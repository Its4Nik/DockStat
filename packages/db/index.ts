import type Logger from "@dockstat/logger"
import { column, DB, defaultExpr, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { CertificateTypeRow, DockStatConfigTableType, RepoType } from "@dockstat/typings/types"
import { defaultConfig, defaultRepositories } from "./defaults"

class DockStatDB {
  protected db: DB
  private config_table: QueryBuilder<DockStatConfigTableType>
  private repositories_table: QueryBuilder<RepoType>
  private certificates_table: QueryBuilder<CertificateTypeRow>
  private metrics_table
  private logger: Logger

  constructor(baseLogger: Logger, prefix = "DB") {
    this.logger = baseLogger.spawn(prefix)
    this.logger.info("Initializing DB")

    const dbPath = Bun.env.DOCKSTAT_DB_PATH || "dockstat.sqlite"

    try {
      this.db = new DB(
        dbPath,
        {
          autoBackup: {
            compress: true,
            directory: Bun.env.DOCKSTAT_DB_BACKUP_DIR ?? ".backups",
            enabled: true,
            intervalMs: Bun.env.DOCKSTAT_DB_BACKUP_INTERVAL
              ? Number(Bun.env.DOCKSTAT_DB_BACKUP_INTERVAL) * 60 * 1000
              : undefined,
            maxBackups: Number(Bun.env.DOCKSTAT_MAX_DB_BACKUPS || 10),
          },
          pragmas: [
            ["journal_mode", "WAL"],
            ["cache_size", -64000],
          ],
        },
        this.logger
      )
      this.logger.debug("Created DB instance for dockstat.sqlite")

      this.config_table = this.db.createTable<DockStatConfigTableType>(
        "config",
        {
          additionalSettings: column.json(),
          allow_untrusted_repo: column.boolean({ default: false }),
          autostart_handlers_monitoring: column.boolean({ default: true }),
          config_database_rev: column.text(),
          default_themes: column.json({ notNull: true }),
          hotkeys: column.json(),
          id: column.uuid(),
          keys: column.json({ notNull: true }),
          name: column.text({ notNull: false }),
          nav_links: column.json(),
          tables: column.json({ notNull: true }),
          version: column.text({ notNull: true }),
        },
        {
          constraints: {
            primaryKey: ["id"],
          },
          ifNotExists: true,
          parser: {
            BOOLEAN: ["allow_untrusted_repo", "autostart_handlers_monitoring"],
            JSON: [
              "default_themes",
              "tables",
              "keys",
              "hotkeys",
              "nav_links",
              "additionalSettings",
            ],
          },
        }
      )
      this.logger.debug("Config table successfully initialized")

      this.repositories_table = this.db.createTable<RepoType>(
        "repositories",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          paths: column.json(),
          policy: column.text({ default: "relaxed", notNull: true }),
          source: column.text({ notNull: true }),
          type: column.text({ notNull: true }),
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
          errors: column.integer(),
          id: column.id(),
          requestDurations: column.json(),
          requestsByMethod: column.json(),
          requestsByPath: column.json(),
          requestsByStatus: column.json(),
          totalRequests: column.integer(),
        },
        {
          ifNotExists: true,
          parser: {
            JSON: ["requestsByMethod", "requestsByPath", "requestsByStatus", "requestDurations"],
          },
        }
      )

      this.logger.debug("Metrics table successfully initialized")

      this.certificates_table = this.db.createTable<CertificateTypeRow>(
        "certificates",
        {
          algorithm: column.text({ notNull: false }),

          comment: column.text({ notNull: false }),

          // Stored as TEXT (ISO 8601). Defaults to current UTC time.
          createdAt: column.text({
            default: defaultExpr("(datetime('now'))"),
            notNull: true,
          }),
          expiresAt: column.text({ notNull: false }),
          externalRef: column.text({ notNull: false }),
          // SHA-256 fingerprint of the public material for display/dedup.
          fingerprint: column.text({ notNull: false }),
          format: column.text({ default: "pem", notNull: true }),
          id: column.uuid({ generateDefault: true, notNull: true, primaryKey: true }),
          // Private material. Encrypted at rest by the service layer.
          privateData: column.text({ notNull: false }),

          // Public material (cert chain / OpenSSH pub key). Safe to expose.
          publicData: column.text({ notNull: false }),
          source: column.text({ default: "imported", notNull: true }),
          tags: column.json({ default: defaultExpr("'[]'"), notNull: true }),
          title: column.text({ notNull: true }),
          type: column.text({ notNull: true }),
          updatedAt: column.text({
            default: defaultExpr("(datetime('now'))"),
            notNull: true,
          }),
        },
        {
          ifNotExists: true,
          parser: {
            JSON: ["tags"],
          },
        }
      )
      this.logger.debug("Certificates table successfully initialized")

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

  public getCertificatesTable() {
    return this.certificates_table
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
    return this.db.getPath()
  }
}

export default DockStatDB
