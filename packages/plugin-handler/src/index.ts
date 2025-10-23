import type { type PluginBase } from "@dockstat/typings/types";
import { DB, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import Logger from "@dockstat/logger";

class PluginHandler {
  private DB: DB;
  private logger: Logger;
  private table: QueryBuilder<PluginBase>;

  constructor(db: DB, parents: string[]) {
    this.DB = db;
    this.logger = new Logger("PluginHandler", parents);
  }
}
