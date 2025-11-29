import type { Plugin, PluginMetaType } from "@dockstat/typings/types"
import { config } from "./src/config"
import type { DockMonTable } from "./src/types"
import { mapFromHostMetricHookToDb } from "./src/utils/mapTo"

export const meta: PluginMetaType = {
	name: "DockMon",
	repoType: "default",
	repository: "its4nik/dockstat:dev/apps/dockstore",
	version: "0.1.0",
	author: {
		license: "MIT",
		name: "Its4Nik",
		email: "dockstat@itsnik.de",
		website: "https://itsnik.de",
	},
	description:
		"This is a default Plugin for DockStat, this Plugin enables the Monitoring and Metrics Pages. Monitoring and Metrics collection is still handled by DockStat, this plugin just listens for 'host:metrics' and 'container:metrics' and saves the data in a Table of the main DockStat DB.",
	manifest: "src/content/plugins/dockmon/manifest.yml",
}

const DockMon: Plugin<DockMonTable> = {
	...meta,
	config: config,
	events: {
		"host:metrics": (ctx, { table }) =>
			table.insert(mapFromHostMetricHookToDb(ctx)),
	},
}

export default DockMon
