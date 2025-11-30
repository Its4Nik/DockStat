import { column, QueryBuilder } from "@dockstat/sqlite-wrapper"
import type DB from "@dockstat/sqlite-wrapper"
import type { DBPluginShemaT, Plugin } from "@dockstat/typings/types"
import Logger from "@dockstat/logger"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { unlink } from "node:fs/promises"
import type { EVENTS } from "@dockstat/typings"

class PluginHandler {
	private loadedPluginsMap = new Map<number, Plugin>()
	private pluginServerHooks = new Map<
		number,
		{ table: QueryBuilder; logger: Logger }
	>()
	private DB: DB
	private table: QueryBuilder<DBPluginShemaT>
	private logger: Logger

	constructor(db: DB, loggerParents: string[] = []) {
		this.logger = new Logger("PluginHandler", loggerParents)
		this.logger.debug("Initializing...")

		this.DB = db

		this.logger.debug("Creating Plugin Table")
		this.table = this.DB.createTable<DBPluginShemaT>(
			"plugins",
			{
				id: column.id(),
				repoType: column.enum(["github", "gitlab", "local", "default"]),
				// Plugin Metadata
				name: column.text({ notNull: true, unique: true }),
				description: column.text({ notNull: false }),
				tags: column.json(),
				version: column.text({ notNull: true }),
				repository: column.text({ notNull: true }),
				manifest: column.text({ notNull: true }),
				author: column.json({ notNull: true }),

				plugin: column.text(),
			},
			{
				ifNotExists: true,
				parser: {
					JSON: ["author", "tags"],
				},
			}
		)
	}

	public getAll() {
		this.logger.debug("Fetching all plugins")
		return this.table
			.select([
				"author",
				"description",
				"id",
				"manifest",
				"name",
				"repoType",
				"repository",
				"tags",
				"version",
			])
			.all()
	}

	public savePlugin(plugin: DBPluginShemaT, update?: boolean) {
		try {
			this.logger.debug(`Saving Plugin ${plugin.name} to DB`)
			if (update) {
				this.logger.info(`Updating Plugin ${plugin.name}`)
				this.unloadPlugin(Number(plugin.id))
				this.deletePlugin(Number(plugin.id))
				this.savePlugin(plugin, false)
				return {
					success: true,
					message: "Plugin saved successfully",
				}
			}
			const res = this.table.insert(plugin)
			this.logger.debug(`Plugin ${plugin.name} saved`)
			return {
				success: true,
				id: res.insertId,
				message: "Plugin saved successfully",
			}
		} catch (error: unknown) {
			this.logger.error(`Could not save ${plugin.name} - ${error}`)
			return {
				error: `${error}`,
				success: false,
				message: "Failed to save plugin",
			}
		}
	}

	public deletePlugin(id: number) {
		this.logger.debug(`Deleting Plugin: ${id}`)
		try {
			this.table.where({ id: id }).delete()
			this.logger.info(`Deleted Plugin: ${id}`)
			return {
				success: true,
				message: "Deleted Plugin",
			}
		} catch (error: unknown) {
			this.logger.error(`Could not delete Plugin: ${id} - ${error}`)
			return {
				success: false,
				message: `Could not delete Plugin: ${id}`,
				error: `${error}`,
			}
		}
	}

	public async loadPlugins(ids: number[]) {
		this.logger.debug(`Loading plugins: ${ids}`)
		const successes: number[] = []
		const errors: number[] = []
		let step = 0

		for (const id of ids) {
			++step
			try {
				await this.loadPlugin(id)
				successes.push(id)
			} catch (error: unknown) {
				this.logger.error(`Could not load ${id} - ${error}`)
				errors.push(id)
			}
		}

		this.logger.info(`Done with ${step}/${ids.length}`)

		return { errors, successes }
	}

	public async loadAllPlugins() {
		const plugins = this.table.select(["*"]).all()
		const loadedPlugins = this.loadedPluginsMap

		const validPlugins = plugins.filter((p): p is DBPluginShemaT => {
			if (loadedPlugins.get(p.id as number)) {
				return false
			}
			const valid = Boolean(p.plugin && p.id)
			this.logger.info(`Validating plugin ${p.id}: ${valid}`)
			return valid
		})

		const imports = await Promise.allSettled(
			validPlugins.map(async (plugin) => {
				const tempPath = join(tmpdir(), `plugin-${plugin.id}-${Date.now()}.js`)
				this.logger.debug(`Writing plugin ${plugin.id} to ${tempPath}`)
				try {
					await Bun.write(tempPath, plugin.plugin)
					const mod = (await import(/* @vite-ignore */ tempPath))
						.default as Plugin
					//console.debug(mod)

					mod.id = plugin.id as number

					this.logger.debug(
						`Creating table for plugin ${plugin.id} if needed - ${JSON.stringify(mod.config)}`
					)

					let table = null

					if (mod.config?.table) {
						table = this.DB.createTable<Record<string, unknown>>(
							mod.config.table.name,
							mod.config?.table.columns,
							{
								parser: { JSON: mod.config.table.jsonColumns },
								ifNotExists: true,
							}
						)
					}

					if (table) {
						this.logger.debug(
							`Registering server Hooks for plugin ${plugin.id}`
						)
						this.pluginServerHooks.set(mod.id as number, {
							table,
							logger: new Logger(
								mod.name,
								this.logger.getParentsForLoggerChaining()
							),
						})
					}

					if (!plugin.id) {
						this.logger.error(`Plugin ${plugin.id} has no ID`)
						throw new Error(`Plugin ${plugin.id} has no ID`)
					}

					return { id: plugin.id, module: mod }
				} catch (err) {
					this.logger.error(`Failed to import plugin ${plugin.id}: ${err}`)
					return null
				} finally {
					await unlink(tempPath).catch(() => {})
				}
			})
		)

		for (const result of imports) {
			if (result.status === "fulfilled" && result.value) {
				this.logger.info(`Loaded plugin ${result.value.id}`)
				this.loadedPluginsMap.set(
					result.value.id as number,
					result.value.module
				)
			}
		}
	}

	public getServerHooks(id: number) {
		return this.pluginServerHooks.get(id)
	}

	public unloadAllPlugins() {
		return this.loadedPluginsMap.clear()
	}

	public unloadPlugin(id: number) {
		return this.loadedPluginsMap.delete(id)
	}

	public async loadPlugin(id: number) {
		const pluginToLoad = this.table.select(["*"]).where({ id: id }).first()

		if (!pluginToLoad) {
			throw new Error(`No Plugin found for id: ${id}`)
		}

		if (this.loadedPluginsMap.get(id)) {
			throw new Error(`Plugin already loaded: ${id}`)
		}

		const tempPath = join(tmpdir(), `plugin-${id}-${Date.now()}.js`)

		try {
			await Bun.write(tempPath, pluginToLoad.plugin)
			const mod = (await import(/* @vite-ignore */ tempPath)).default as Plugin
			this.loadedPluginsMap.set(pluginToLoad.id as number, mod)
			mod.id = pluginToLoad.id
			this.logger.debug(
				`Creating table for plugin ${pluginToLoad.id} if needed`
			)
			mod.config?.table &&
				this.DB.createTable(mod.config.table.name, mod.config?.table.columns, {
					parser: { JSON: mod.config.table.jsonColumns },
					ifNotExists: true,
				})

			return this.loadedPluginsMap.get(id)
		} finally {
			await unlink(tempPath).catch(() => {})
		}
	}

	public getTable(): QueryBuilder<DBPluginShemaT> {
		return this.table
	}

	public getLoadedPlugins() {
		const loaded: number[] = []
		for (const plugin of this.loadedPluginsMap.keys()) {
			loaded.push(plugin)
		}
		return loaded
	}

	public getStatus() {
		const installedPlugins = this.table.select(["*"]).all()
		const loadedPlugins = this.getLoadedPlugins()
		const repos = installedPlugins.map((l) => l.repository)

		const rDat = {
			installed_plugins: {
				count: installedPlugins.length,
				data: installedPlugins,
			},
			repos: [...new Set(repos)],
			loaded_plugins: loadedPlugins
				.map((id) => installedPlugins.find((plugin) => plugin.id === id))
				.filter(Boolean),
		}
		return rDat
	}

	public async installFromManifestLink(url: string) {
		const res = await fetch(url)
		const txt = await res.text()

		return this.savePlugin(this.parseManifest(url, txt))
	}

	private parseManifest(link: string, manifest: string): DBPluginShemaT {
		if (link.endsWith("json")) {
			return JSON.parse(manifest) as DBPluginShemaT
		}
		if (link.endsWith("yml") || link.endsWith("yaml")) {
			return Bun.YAML.parse(manifest) as DBPluginShemaT
		}
		throw new Error("Unsupported manifest")
	}

	public async handleRoute(req: Request, params: Record<string, string>) {
		const { id } = params

		if (!id) {
			throw new Error("PluginID not provided!")
		}

		const plugin = this.loadedPluginsMap.get(Number(id))

		if (!plugin) {
			throw new Error(`No loaded Plugin with ID ${id} found`)
		}

		if (!plugin.routes) {
			throw new Error(`No routes defined for Plugin ${id}`)
		}

		return await plugin.routes.handle(req)
	}

	public getHookHandlers() {
		this.logger.info("Getting Hook Handlers")
		const loadedPlugins = Array.from(this.loadedPluginsMap.values())

		this.logger.debug(
			`Loaded ${loadedPlugins.length} Plugins (${JSON.stringify(loadedPlugins)})`
		)

		const loadedPluginsHooksMap = new Map<number, Partial<EVENTS>>()

		for (const p of loadedPlugins) {
			if (p.events) {
				this.logger.info(`Caching Hooks for Plugin ${p.id}`)
				loadedPluginsHooksMap.set(Number(p.id), p.events)
			}
		}

		this.logger.info(`Cached ${loadedPluginsHooksMap.size} Hooks`)
		return loadedPluginsHooksMap
	}
}

export default PluginHandler
