import { column } from "@dockstat/sqlite-wrapper"
import type { PLUGIN } from "@dockstat/typings"
import type { actions } from "./actions"
import type { DockNodePluginTable } from "./types"

export const DockNodeConfig: PLUGIN.PluginConfig<DockNodePluginTable, typeof actions> = {
  table: {
    name: "docknode",
    parser: {
      // Indicate which columns should be treated as JSON by the sqlite wrapper/parser.
      JSON: ["host", "certData", "handlers", "authenticationKey"],
    },
    columns: {
      id: column.id(),
      name: column.text({ notNull: true, unique: true }),
      host: column.json({ notNull: true }),
      certData: column.json({ notNull: false }),
      handlers: column.json({}),
      authenticationKey: column.json({ notNull: true, unique: true }),
    },
    jsonColumns: ["host", "certData", "handlers", "authenticationKey"],
  },
  apiRoutes: {
    "/": {
      method: "GET",
      actions: [""],
    },
  },
} as const satisfies PLUGIN.PluginConfig<DockNodePluginTable, typeof actions>
