import PluginBuilder from "@dockstat/plugin-handler/pluginBuilder";
import { actions } from "./src/actions";
import { DocksStacksMeta } from "./src/meta";
import { DockStacksRoutes } from "./src/routes";
import type { DockStacksTable } from "./src/types";

const DockStacks = new PluginBuilder<DockStacksTable, typeof actions>(
  DocksStacksMeta,
  DockStacksRoutes,
  actions
);

export default DockStacks;
