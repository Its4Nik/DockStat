import type { DB, QueryBuilder } from "@dockstat/sqlite-wrapper";
import type {
  PluginActions,
  PluginConfig,
  PluginMeta,
} from "@dockstat/typings";

/* Plugin class is generic over row type T and concrete Actions A */
export default class Plugin<
  T extends Record<string, unknown>,
  A extends PluginActions<T>
> {
  public meta: PluginMeta;
  public pluginTable: QueryBuilder<T> | null;
  public backendConfig: PluginConfig<T, A>;
  public backendActions: A;
  public tableActive = false;

  constructor(meta: PluginMeta, backendConfig: PluginConfig<T, A>, actions: A) {
    this.meta = meta;
    this.backendConfig = backendConfig;
    this.backendActions = actions;
    this.pluginTable = null;
  }

  implementTable(db: DB): void {
    if (this.backendConfig.table?.name) {
      this.pluginTable = db.createTable(
        this.backendConfig.table.name,
        this.backendConfig.table.columns,
        {
          jsonConfig: this.backendConfig.table.jsonColumns,
        }
      );
      this.tableActive = true;
    } else {
      this.pluginTable = null;
    }
  }
}
