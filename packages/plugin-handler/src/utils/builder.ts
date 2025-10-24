import type { ColumnDefinition } from "@dockstat/sqlite-wrapper";
import type { Plugin } from "@dockstat/typings/types";

export function definePlugin(plugin: Plugin<Record<string, ColumnDefinition>>) {
  return plugin;
}
