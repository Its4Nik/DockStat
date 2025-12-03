import { DBPluginShema } from "@dockstat/typings/schemas"
import { t } from "elysia"

export namespace PluginModel {
	export const installPluginBody = DBPluginShema

	export const activatePluginBody = t.Array(t.Number())
	export const activatePluginRes = t.Object({
		errors: t.Array(t.Number()),
		successes: t.Array(t.Number()),
	})

	export const deletePluginBody = t.Object({ pluginId: t.Number() })
}
