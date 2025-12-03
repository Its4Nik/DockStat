import { column } from "@dockstat/sqlite-wrapper"
import type { PluginConfig } from "@dockstat/typings"
import type { DockMonTable } from "./types"

export const config: PluginConfig<DockMonTable, {}> = {
	apiRoutes: {
		"/all": {
			actions: [],
			method: "GET",
		},
	},
	table: {
		columns: {
			id: column.id(),
			type: column.enum(["CONTAINER", "HOST"]),
			host_id: column.integer(),
			docker_client_id: column.integer(),
			container_id: column.text({ notNull: false }),
			data: column.json(),
			stored_on: column.createdAt(),
		},
		jsonColumns: ["data"],
		name: "dockmon",
	},
}
