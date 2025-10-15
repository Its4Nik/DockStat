import { column } from "@dockstat/sqlite-wrapper";
import type { PLUGIN } from "@dockstat/typings";
import type { actions } from "./actions";
import type { DockStacksTable } from "./types";

export const DockStacksTableConfig: Partial<
  PLUGIN.PluginConfig<DockStacksTable, typeof actions>
> = {
  table: {
    name: "dockstacks",
    columns: {
      id: column.id(),
      name: column.text({ notNull: true, unique: true }),
      stackMeta: column.json({ notNull: true }),
      stackDeployConfig: column.json({ notNull: true }),
      compose: column.json({ notNull: true }),
    },
    jsonColumns: ["compose", "stackMeta", "stackDeployConfig"],
  },
};
