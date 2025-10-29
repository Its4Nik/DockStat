import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type DB from "@dockstat/sqlite-wrapper"
import type { DBPlugin, Plugin } from "@dockstat/typings/types"
import Logger from "@dockstat/logger"

class PluginHandler {
  private loadedPluginsMap = new Map<number, Plugin>()
  private DB: DB
  private table: QueryBuilder<DBPlugin>
  private logger: Logger

  constructor(db: DB, loggerParents: string[] = []) {
    this.logger = new Logger("PluginHandler", loggerParents)
    this.logger.debug("Initializing...")

    this.DB = db

    this.logger.debug("Creating Plugin Table")
    this.table = this.DB.createTable<DBPlugin>("plugins", {
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

      plugin: column.module({ moduleConstrains: { default: true, exports: [] } })
    }, {
      ifNotExists: true, parser: {
        JSON: ["table", "ws", "events"],
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

  public savePlugin(plugin: DBPlugin) {
    this.logger.debug(`Saving Plugin ${plugin.name} to DB`)
    return this.table.insert(plugin)
  }

  public deletePlugin(id: number) {
    this.logger.debug(`Deleting Plugin ${id}`)
    return this.table.where({ id: id }).delete()
  }

  public async loadPlugins() {
    const plugins = this.table.select(["*"]).all()

    const loadedPlugins = this.loadedPluginsMap

    const validPlugins = plugins.filter((p): p is DBPlugin => {
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

    const mod = (await import(pluginToLoad.plugin)) as Plugin

    return this.loadedPluginsMap.set(pluginToLoad.id as number, mod)
  }

  public getTable() {
    return this.table
  }
}

export default PluginHandler
