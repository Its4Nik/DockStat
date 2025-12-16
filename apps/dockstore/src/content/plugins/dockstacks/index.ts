import type { Plugin } from "@dockstat/typings/types"
import DockStacksElysia from "./src/elyisa"
import { PluginMeta } from "./src/meta"

const DockStacks: Plugin = {
  ...PluginMeta,
  routes: DockStacksElysia,
}

export default DockStacks
export const meta = PluginMeta
