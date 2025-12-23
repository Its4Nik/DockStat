import type { PluginMetaType } from "@dockstat/typings/types"

export const PluginMeta: PluginMetaType = {
  name: "DockStacks",
  description:
    "This Plugin allows for deploying so called stacks. Stacks are prebuilt docker compose file, with tempplating and plugin support",
  repository: "its4nik/dockstat:dev/apps/dockstore",
  version: "1.0.0",
  tags: ["compose", "management"],
  author: {
    email: "info@itsnik.de",
    license: "MIT",
    name: "Its4Nik",
    website: "https://github.com/Its4Nik",
  },
  manifest: "src/content/plugins/dockstacks/manifest.ts",
  repoType: "github",
}
