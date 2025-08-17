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
    this.config_table = this.DB.table<DATABASE.DB_config>("config", {
      jsonColumns: ["target_hosts", "theme_config"],
    });
    this.theme_table = this.DB.table<THEME.THEME_config>("themes", {
      jsonColumns: ["vars"],
    });

    // Initialize config table if empty, otherwise load existing config
    const existingConfig = this.config_table.select(["*"]).get();
    if (!existingConfig) {
      this.updateConfigTable(this.config);
    } else {
      // Load existing config from database
      this.config = existingConfig;
    }
  }

  public setConfig(config: DATABASE.DB_config) {
    this.config = config;
    return this.updateConfigTable(config);
  }

  public getConfig() {
    const stored = this.config_table.select(["*"]).get();
    return stored || this.config;
  }

  private updateConfigTable(config: DATABASE.DB_config) {
    const configWithId = {
      id: 1,
      ...config,
    };

    // Use upsert (insert or replace) to ensure only one config row exists
    return this.config_table.insert(configWithId, { orReplace: true });
  }

  public addOrUpdateTheme(theme: THEME.THEME_config) {
    return this.theme_table.insert(theme, { orReplace: true });
  }

  public getTheme(themeName: string) {
    return this.theme_table.select(["*"]).where({ name: themeName }).get();
  }

  public getThemes() {
    return this.theme_table.select(["*"]).all();
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
