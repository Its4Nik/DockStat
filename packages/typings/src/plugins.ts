export * from "./plugin-base";
import type {
  ColumnDefinition,
  JsonColumnConfig,
} from "@dockstat/sqlite-wrapper";
import type { PluginActions } from "./plugin-base";

/* PluginRoute defines the API route configuration for a plugin action */
export type PluginRoute<Action> = {
  method: "GET" | "POST";
  actions: Action[]; // must be keys from the actions map
};

export type FrontendRoute = unknown; // Placeholder for future frontend route definitions

/* PluginConfig defines the complete configuration for a plugin */
export type PluginConfig<
  T extends Record<string, unknown>,
  A extends PluginActions<T>
> = {
  table?: {
    name: string;
    jsonColumns: JsonColumnConfig<T>;
    columns: Record<string, ColumnDefinition>;
  };
  apiRoutes?: Record<string, PluginRoute<Extract<keyof A, string>>>; // routes.actions must be keys of A
};
