import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type DB from "@dockstat/sqlite-wrapper"
import type { DBPluginShemaT, Plugin } from "@dockstat/typings/types"
import Logger from "@dockstat/logger"

class PluginHandler {
  private loadedPluginsMap = new Map<number, Plugin>()
  private DB: DB
  private table: QueryBuilder<DBPluginShemaT>
  private logger: Logger

  constructor(db: DB, loggerParents: string[] = []) {
    this.logger = new Logger("PluginHandler", loggerParents)
    this.logger.debug("Initializing...")

    this.DB = db

    this.logger.debug("Creating Plugin Table")
    this.table = this.DB.createTable<DBPluginShemaT>("plugins", {
      id: column.id(),
      // Plugin Metadata
      name: column.text({ notNull: true, unique: true }),
      description: column.text({ notNull: false }),
      tags: column.json(),
      version: column.text({ notNull: true }),
      repository: column.text({ notNull: true }),
      type: column.enum(["http", "github", "gitlab"]),
      branch: column.text({ notNull: false }),
      manifest: column.text({ notNull: true }),
      author: column.json({ notNull: true }),

      plugin: column.module()
    }, {
      ifNotExists: true, parser: {
        JSON: ["table", "author", "tags"],
        MODULE: {
          "plugin": {
            loader: "ts",
            minifyWhitespace: true,
            allowBunRuntime: true,
            target: "bun"
          }
        }
      }
    })
  }

  public savePlugin(plugin: DBPluginShemaT) {
    this.logger.debug(`Saving Plugin ${plugin.name} to DB`)
    return this.table.insert(plugin)
  }

  public deletePlugin(id: number) {
    this.logger.debug(`Deleting Plugin ${id}`)
    return this.table.where({ id: id }).delete()
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

      return Boolean(p.plugin && p.id)
    })

    const imports = await Promise.allSettled(
      validPlugins.map(async (plugin) => {
        try {
          const mod = (await import(plugin.plugin)) as Plugin
          return { id: plugin.id, module: mod }
        } catch (err) {
          console.error(`Failed to import plugin ${plugin.plugin}:`, err)
          return null
        }
      })
    )

    for (const result of imports) {
      if (result.status === "fulfilled" && result.value) {
        this.loadedPluginsMap.set(result.value.id as number, result.value.module)
      }
    }
    return;
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

    const mod = (await import(pluginToLoad.plugin)) as Plugin

    return this.loadedPluginsMap.set(pluginToLoad.id as number, mod)
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
    const installedPlugins = this.table.select(['*']).all()
    const loadedPlugins = this.getLoadedPlugins()

    const rDat = {
      installed_plugins: installedPlugins.length,
      types: {
        gitlab: installedPlugins.filter((e) => e.type === 'gitlab'),
        github: installedPlugins.filter((e) => e.type === 'github'),
        http: installedPlugins.filter((e) => e.type === 'http'),
        default: installedPlugins.filter((e) => e.type === "default")
      },
      repos: installedPlugins.map(l => l.repository),
      loaded_plugins: loadedPlugins
        .map(id => installedPlugins.find(plugin => plugin.id === id))
        .filter(Boolean)
    }

    this.logger.debug(JSON.stringify(rDat))
    return rDat
  }

  public async installFromManifestLink(url: string) {
    const res = (await fetch(url))
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
    const { id } = params;

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
}

export default PluginHandler
