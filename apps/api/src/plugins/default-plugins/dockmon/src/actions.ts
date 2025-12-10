import type { PluginActions } from "@dockstat/typings"
import type { DockMonTable } from "./types"

const DockMonActions: PluginActions<DockMonTable> = {
	getSavedMetrics: ({ table }) => table?.select(["*"]).all(),
}

export default DockMonActions
