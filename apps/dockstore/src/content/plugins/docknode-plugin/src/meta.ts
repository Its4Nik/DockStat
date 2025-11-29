import type { PluginMetaType } from "@dockstat/typings/types"

export const DockNodePluginMeta: PluginMetaType = {
	name: "DockNode",
	description: "Allows management of remote nodes",
	author: {
		license: "MIT",
		name: "Its4Nik",
		website: "https://github.com/Its4Nik",
		email: "dockstat@itsnik.de",
	},
	version: "1.0.0",
	tags: ["stacks", "fs", "apps", "remote"],
	repository: "its4nik/dockstat:dev/apps/dockstore",
	manifest: "src/content/plugins/docknode-plugin/manifest.yml",
	repoType: "github",
}
