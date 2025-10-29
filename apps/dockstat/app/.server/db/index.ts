import DBFactory from "@dockstat/db";
import type DB from "@dockstat/sqlite-wrapper";
import type { QueryBuilder } from "@dockstat/sqlite-wrapper";
import type {
  DockStatConfigTableType,
} from "@dockstat/typings/types";

const InitialDockStatDB = new DBFactory("DB", ["Elysia", "DockStat"]);

export const DockStatDB: {
  _sqliteWrapper: DB;
  _dbPath: string;
  configTable: QueryBuilder<DockStatConfigTableType>;
} = {
  _sqliteWrapper: InitialDockStatDB.getDB(),
  _dbPath: InitialDockStatDB.getDatabasePath(),
  configTable: InitialDockStatDB.getConfigTable(),
};
