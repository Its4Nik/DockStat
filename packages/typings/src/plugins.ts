import type Plugin from "@dockstat/plugin-handler/src/pluginBuilder";
import type {
  ColumnDefinition,
  DB,
  JsonColumnConfig,
  QueryBuilder,
} from "@dockstat/sqlite-wrapper";

export type PluginTable = {
  id?: number;
  meta: PluginMeta;
  plugin: {
    backendConfig: Config<any, any>;
    backendActions: unknown;
    frontendConfig: unknown;
  };
};

export type PluginInstance = Plugin<Record<string, unknown>, unknown>;

export interface PluginRegistry {
  instance: PluginInstance;
  routes: Record<string, { method: string; actions: string[] }>;
}

export type PluginMeta = {
  name: string;
  author: { name: string; website?: string; email?: string };
  version: string;
  tags: string[];
  repository: string;
  path: string;
};

/* ---------- Action function signature ---------- */
/**
 * ctx.table may be null if plugin was created without a table.
 * ctx.params is provided for route parameters / body if you want to pass them through.
 * The action may return any R (synchronous or Promise).
 */
type BackendActionFn<T extends Record<string, unknown>, R = unknown> = (ctx: {
  table: QueryBuilder<T> | null;
  db: DB;
  params?: Record<string, unknown>;
  previousAction: unknown;
}) => Promise<R> | R;

/* DBActions is an object map from action-name -> function */
export type DBActions<T extends Record<string, unknown>> = Record<
  string,
  BackendActionFn<T>
>;

/* BackendRoute only allows action names that exist on the DBActions object (see Config below) */
type BackendRoute<ActionKeys> = {
  method: "GET" | "POST";
  actions: ActionKeys[]; // must be keys from the actions map
};

/* Config ties the routes to a specific Actions shape A */
export type Config<
  T extends Record<string, unknown>,
  A extends DBActions<T>,
> = {
  table?: {
    name: string;
    jsonColumns: JsonColumnConfig<T>;
    columns: Record<string, ColumnDefinition>;
  };
  routes: Record<string, BackendRoute<Extract<keyof A, string>>>; // routes.actions must be keys of A
};
