import type { PluginConfig } from "@dockstat/typings";
import type { actions } from "./actions";
import { DockStacksTableConfig } from "./table";
import type { DockStacksTable } from "./types";

export const DockStacksConfig: PluginConfig<DockStacksTable, typeof actions> = {
  table: DockStacksTableConfig.table,
  apiRoutes: {
    "/stacks/save": {
      method: "POST",
      actions: ["saveStack"],
    },
  },
};
