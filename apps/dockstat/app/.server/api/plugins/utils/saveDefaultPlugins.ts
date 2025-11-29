import type PluginHandlerFactory from "@dockstat/plugin-handler"
import type { DBPluginShemaT, PluginMetaType } from "@dockstat/typings/types"
import { Glob } from "bun"
import { logger } from "./logger"

let id = 1

export async function saveDefaultPlugins(
	pluginHandlerFactory: PluginHandlerFactory
) {
	logger.info("Saving default plugins")
	const path = `${process.cwd()}/app/.server/api/plugins/default-plugins/*/*.ts`
	const plugins = new Glob(path)
	const pluginPaths = Array.from(plugins.scanSync({ absolute: true }))

	logger.debug(`Found ${pluginPaths.length} default plugins in ${path}`)

	for (const p of pluginPaths) {
		logger.debug(`Processing plugin ${p}`)

		const { meta } = (await import(/* @vite-ignore */ p)) as {
			meta: PluginMetaType
		}

		const build = await Bun.build({
			entrypoints: [p],
			minify: {
			  identifiers: false,
			  keepNames: true,
			  syntax: false,
			  whitespace: true,
			},
			splitting: false,
			banner: "/*　Bundled by DockStat　*/",
			outdir: "./.bundled",
			target: "node",
		})

		const js = await build.outputs[0].text()

		saveDefaultPlugin(pluginHandlerFactory, meta, js)
	}

	pluginHandlerFactory.loadAllPlugins()
}

function saveDefaultPlugin(
	pluginHandler: PluginHandlerFactory,
	meta: PluginMetaType,
	js: string
) {
	const pPlug: DBPluginShemaT = {
		id: id,
		author: meta.author,
		description: meta.description,
		manifest: meta.manifest,
		name: meta.name,
		plugin: js,
		repoType: "default",
		repository: "Default",
		version: meta.version,
		tags: [...(meta.tags ?? []), "default"],
	}

	id++

	logger.debug(`Saving default plugin ${pPlug.name}	(${pPlug.repoType})`)

	const saveRes = pluginHandler.savePlugin(pPlug, true)

	if (saveRes.success) {
		logger.info(`Default plugin ${meta.name} saved successfully`)
	} else {
		logger.error(`Failed to save default plugin ${meta.name}: ${saveRes.error}`)
	}
}
