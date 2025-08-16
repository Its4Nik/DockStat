import { DB, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import type { THEME, DATABASE } from "@dockstat/typings";
import { darkDockStatTheme } from "./default_theme";

class DockStatDB {
  private DB = new DB("dockstat.sqlite");
  private config: DATABASE.DB_config;
  private config_table: QueryBuilder<DATABASE.DB_config>;
  private theme_table: QueryBuilder<THEME.THEME_config>;

  constructor() {
    this.config = {
      fetch_interval: 5,
      target_hosts: [],
      theme_config: darkDockStatTheme,
    };
    this.DB.createTable(
      "config",
      {
        id: "INTEGER PRIMARY KEY",
        fetch_interval: "INTEGER NOT NULL",
        target_hosts: "TEXT NOT NULL",
        theme_config: "TEXT NOT NULL",
      },
      {
        ifNotExists: true,
        withoutRowId: false,
      },
    );
    this.DB.createTable(
      "themes",
      {
        name: "TEXT UNIQUE NOT NULL",
        version: "TEXT NOT NULL",
        creator: "TEXT NOT NULL",
        license: "TEXT NOT NULL",
        vars: "TEXT NOT NULL",
      },
      {
        ifNotExists: true,
        withoutRowId: false,
      },
    );
    this.config_table = this.DB.table<DATABASE.DB_config>("config");
    this.theme_table = this.DB.table<THEME.THEME_config>("themes");

    // Initialize config table if empty, otherwise load existing config
    const existingConfig = this.config_table.select(["*"]).get();
    if (!existingConfig) {
      this.updateConfigTable(this.config);
    } else {
      // Load existing config from database
      this.config = {
        fetch_interval: existingConfig.fetch_interval,
        target_hosts: JSON.parse(
          existingConfig.target_hosts as unknown as string,
        ),
        theme_config: JSON.parse(
          existingConfig.theme_config as unknown as string,
        ),
      };
    }
  }

  public setConfig(config: DATABASE.DB_config) {
    this.config = config;
    return this.updateConfigTable(config);
  }

  public getConfig() {
    const stored = this.config_table.select(["*"]).get();
    if (stored) {
      return {
        fetch_interval: stored.fetch_interval,
        target_hosts: JSON.parse(stored.target_hosts as string),
        theme_config: JSON.parse(stored.theme_config as string),
      };
    }
    return this.config;
  }

  private updateConfigTable(config: DATABASE.DB_config) {
    const serializedConfig = {
      id: 1,
      fetch_interval: config.fetch_interval,
      target_hosts: JSON.stringify(config.target_hosts),
      theme_config: JSON.stringify(config.theme_config),
    };

    // Use upsert (insert or replace) to ensure only one config row exists
    return this.config_table.insert(serializedConfig, { orReplace: true });
  }

  public addOrUpdateTheme(theme: THEME.THEME_config) {
    const serializedTheme = {
      name: theme.name,
      version: theme.version,
      creator: theme.creator,
      license: theme.license,
      vars: JSON.stringify(theme.vars),
    };
    return this.theme_table.insert(serializedTheme, { orReplace: true });
  }

  public getTheme(themeName: string) {
    const stored = this.theme_table
      .select(["*"])
      .where({ name: themeName })
      .get();
    if (stored) {
      return {
        name: stored.name,
        version: stored.version,
        creator: stored.creator,
        license: stored.license,
        vars: JSON.parse(stored.vars as string),
      };
    }
    return stored;
  }

  public getThemes() {
    const stored = this.theme_table.select(["*"]).all();
    return stored.map((theme) => ({
      name: theme.name,
      version: theme.version,
      creator: theme.creator,
      license: theme.license,
      vars: JSON.parse(theme.vars as string),
    }));
  }

  public setTheme(themeName: string) {
    const theme = this.getTheme(themeName);
    const currentConfig = this.getConfig();
    if (theme) {
      const config: DATABASE.DB_config = {
        ...currentConfig,
        theme_config: theme,
      };
      this.config = config;
      return this.updateConfigTable(config);
    }
    return null;
  }
}

export default DockStatDB;
