//import PluginBuilder from "@dockstat/plugin-handler/pluginBuilder";
import type { Plugin } from "@dockstat/typings/types"
import { DockNodeConfig } from "./src/config"
import { DockNodePluginMeta } from "./src/meta"
import type { DockNodePluginTable } from "./src/types"

export const meta = DockNodePluginMeta

const DockNodePlugin: Plugin<DockNodePluginTable> = {
  ...DockNodePluginMeta,
  config: DockNodeConfig,
}

export default DockNodePlugin
