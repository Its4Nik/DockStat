import type { PluginActions } from "@dockstat/typings"
import type { DockNodePluginTable } from "./types"

export const actions: PluginActions<DockNodePluginTable> = {
	pre: ({ table, instanceId }) => {
		if (!table) {
			throw new Error("Table not initialized")
		}
		if (!instanceId) {
			throw new Error("No instance id found")
		}
	},
	registerNode: ({ table, params }) => {
		const pParams = params as Omit<DockNodePluginTable, "id">
		if (!pParams.authenticationKey) {
			throw new Error(
				"Authentication key needed for connection to DockNode clients needed."
			)
		}
		if ((pParams.name ?? "").length < 1) {
			throw new Error("Name needed to register a node")
		}
		if (!pParams.host.adress || !pParams.host.port || !pParams.host.proto) {
			throw new Error("A full Host object is needed fot registering")
		}

		table?.insertOrReplace({
			authenticationKey: pParams.authenticationKey,
			certData: pParams.certData ?? null,
			handlers: pParams.handlers,
			host: pParams.host,
			name: pParams.name,
		})
	},
	getNodes: ({ table, logger }) => {
		logger.info("Getting Node count")
		return table?.select(["*"]).count()
	},
} as const
