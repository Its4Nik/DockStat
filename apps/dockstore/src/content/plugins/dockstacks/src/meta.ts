import type { PLUGIN } from "@dockstat/typings";

export const DocksStacksMeta: PLUGIN.PluginMeta = {
  name: "DockStacks",
  description: "One-click installer for Docker Compose stacks.",
  license: "GPL-2.0",
  author: {
    name: "Its4Nik",
    website: "https://github.com/Its4Nik",
    email: "dockstat@itsnik.de",
  },
  version: "1.0.0",
  tags: ["stacks", "compose", "one-click", "apps"],
  repository: "https://dockstore.itsnik.de",
  path: "plugins/dockstacks",
};
