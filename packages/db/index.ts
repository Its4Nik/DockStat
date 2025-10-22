import Logger from "@dockstat/logger";
import { DB, type QueryBuilder, column, addLoggerParents } from "@dockstat/sqlite-wrapper";
import type { DockStatConfigTableType } from "@dockstat/typings/types";

class DockStatDB {
  protected db: DB;
  private config_table: QueryBuilder<DockStatConfigTableType>;
  private logger: Logger

  constructor(prefix = "DockStatDB", parents: string[] = []) {
    this.logger = new Logger(prefix, parents);
    addLoggerParents([prefix, ...parents])
    this.logger.info("Initializing DockStatDB");

    try {
      this.db = new DB("dockstat.sqlite");
      this.logger.debug("Created DB instance for dockstat.sqlite");

      // Create config table (stores current theme name)
      this.logger.debug("Creating config table");
      this.config_table = this.db.createTable<DockStatConfigTableType>(
        "config",
        {
          id: column.uuid(),
          allow_untrusted_repo: column.boolean({ default: false }),
          default_themes: column.json({ notNull: true }),
          tables: column.json({ notNull: true }),
          tls_certs_and_keys: column.json({ notNull: true }),
          registered_repos: column.json({ notNull: true }),
          version: column.text({ notNull: true }),
          hotkeys: column.json(),
          nav_links: column.json(),
          name: column.text({ notNull: false })
        },
        {
          ifNotExists: true,
          jsonConfig: ["registered_repos", "default_themes", "tables", "tls_certs_and_keys", "hotkeys", "nav_links"]
        }
      );
      this.logger.debug("Config table created successfully");

      // Initialize database with defaults if empty
      this.initializeDefaults();
    } catch (error) {
      this.logger.error(`Failed to initialize database: ${error}`);
      throw error;
    }
  }

  private initializeDefaults(): void {
    this.logger.debug("Checking if database needs initialization with defaults");
    try {
      // Initialize config table if empty
      const existingConfig = this.config_table.select(["*"]).get();
      if (!existingConfig) {
        this.logger.info("No existing config found, initializing with defaults");
        this.config_table.insert({
          name: "DockStat",
          version: "1.0.0",
          id: 0,
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
              name: "DockStacks",
              source: "its4nik/dockstat/apps/dockstore",
              type: "github",
              isVerified: true,
              policy: "strict",
              verificatioh_api: "https://api.itsnik.de/dockstacks/_verify",
              hashes: null
            }
          ],
          tables: [],
          tls_certs_and_keys: {},
        });
        this.logger.debug("Default config inserted");
      } else {
        this.logger.debug("Database already initialized, skipping defaults");
      }
    } catch (error) {
      this.logger.error(`Failed to initialize defaults: ${error}`);
      throw error;
    }
  }

  /**
   * Get the underlying sqlite-wrapper DB instance for integration with docker-client
   */
  public getDB(): DB {
    this.logger.debug("Getting DB instance");
    return this.db;
  }

  public getConfigTable() {
    return this.config_table;
  }

  // Database Management

  /**
   * Close the database connection
   */
  public close(): void {
    this.logger.info("Closing database connection");
    try {
      this.db.close();
      this.logger.debug("Database connection closed successfully");
    } catch (error) {
      this.logger.error(`Failed to close database connection: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a raw SQL query (for advanced use cases)
   */
  public exec(sql: string): void {
    this.logger.debug(`Executing raw SQL: ${sql}`);
    try {
      this.db.run(sql);
      this.logger.debug("SQL executed successfully");
    } catch (error) {
      this.logger.error(`Failed to execute SQL: ${error}`);
      throw error;
    }
  }

  /**
   * Get database schema information
   */
  public getSchema(): unknown {
    this.logger.debug("Getting database schema");
    try {
      const schema = this.db.getSchema();
      this.logger.debug("Schema retrieved successfully");
      return schema;
    } catch (error) {
      this.logger.error(`Failed to get database schema: ${error}`);
      throw error;
    }
  }

  /**
   * Get database file path
   */
  public getDatabasePath(): string {
    return "dockstat.sqlite";
  }
}

export default DockStatDB;
