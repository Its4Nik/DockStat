import PluginBuilder from "@dockstat/plugin-handler/pluginBuilder";
import { actions } from "./src/actions";
import { DockStacksConfig } from "./src/config";
import { DocksStacksMeta } from "./src/meta";
import type { DockStacksTable } from "./src/types";

const DockStacks = new PluginBuilder<DockStacksTable, typeof actions>(
  DocksStacksMeta,
  DockStacksConfig,
  actions
);

export default DockStacks;
