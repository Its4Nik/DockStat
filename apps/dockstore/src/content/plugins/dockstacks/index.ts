import type { Plugin } from "@dockstat/typings/types"
import { PluginMeta } from "./src/meta"
import DockStacksElysia from "./src/elyisa"

const DockStacks: Plugin = {
	...PluginMeta,
	routes: DockStacksElysia,
}

export default DockStacks
export const meta = PluginMeta
