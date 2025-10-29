import DBFactory from "@dockstat/db"
import type DB from "@dockstat/sqlite-wrapper"

const InitialDockStatDB = new DBFactory("DB", ["Elysia", "DockStat"])

//import { PluginTable } from "../api/plugins"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DBPlugin, DockStatConfigTableType } from "@dockstat/typings/types";

export const DockStatDB: {
  _sqliteWrapper: DB,
  _dbPath: string,
  configTable: QueryBuilder<DockStatConfigTableType>,
  //pluginTable: QueryBuilder<DBPlugin>
} = {
  _sqliteWrapper: InitialDockStatDB.getDB(),
  _dbPath: InitialDockStatDB.getDatabasePath(),
  configTable: InitialDockStatDB.getConfigTable(),
  //pluginTable: PluginTable
}
