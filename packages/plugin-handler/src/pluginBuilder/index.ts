import type { DB, QueryBuilder } from "@dockstat/sqlite-wrapper";
import type { PLUGIN } from "@dockstat/typings";

/* Plugin class is generic over row type T and concrete Actions A */
export default class Plugin<
  T extends Record<string, unknown>,
  A extends PLUGIN.DBActions<T>,
> {
  public meta: PLUGIN.PluginMeta;
  public table: QueryBuilder<T> | null;
  public config: PLUGIN.Config<T, A>;
  public backendActions: A;

  constructor(
    meta: PLUGIN.PluginMeta,
    config: PLUGIN.Config<T, A>,
    actions: A,
    db: DB
  ) {
    this.meta = meta;
    this.config = config;
    this.backendActions = actions;

    if (this.config.table?.name) {
      this.table = db.createTable(
        this.config.table.name,
        this.config.table.columns,
        {
          jsonConfig: this.config.table.jsonColumns,
        }
      );
    } else {
      this.table = null;
    }
  }
}
