import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type DB from "@dockstat/sqlite-wrapper"
import type { Plugin } from "@dockstat/typings/types"
import type { DockerClientEvents } from "@dockstat/typings"
import Logger from "@dockstat/logger"

export class PluginHandler {
  private loadedPluginsMap = new Map<number, Plugin>()
  private DB: DB
  private table: QueryBuilder<Plugin>
  private logger: Logger

  constructor(db: DB, loggerParents: string[] = []) {
    this.logger = new Logger("PluginHandler", loggerParents)
    this.logger.debug("Initializing...")

    this.DB = db

    this.logger.debug("Creating Plugin Table")
    this.table = this.DB.createTable<Plugin>("plugins", {
      id: column.id(),

      // Plugin Metadata
      name: column.text({ notNull: true, unique: true }),
      description: column.text({ notNull: false }),
      version: column.text({ notNull: true }),
      repository: column.text({ notNull: true }),
      type: column.enum(["http", "github", "gitlab"]),
      branch: column.text({ notNull: false }),
      manifest: column.text({ notNull: true }),
      author: column.json({ notNull: true }),

      // Plugin Hooks / Actions
      routes: column.function(),

      events: column.json()
    }, { ifNotExists: true, jsonConfig: ["table", "routes", "ws", "events"] })
  }

  public savePlugin(plugin: Plugin) {
    this.logger.debug(`Saving Plugin ${plugin.name} to DB`)
    return this.table.insert(plugin)
  }

  public deletePlugin(id: number) {
    this.logger.debug(`Deleting Plugin ${id}`)
    return this.table.where({ id: id }).delete()
  }

  public loadPlugin(id: number) {
    this.logger.debug(`Loading Plugin ${id}`)
    const data = this.table.select(["*"]).where({ id: id }).first()
    if (data) {
      this.loadedPluginsMap.set(id, data)
    } else {
      this.logger.error(`Plugin ${id} not found in DB`)
    }
  }

  public unLoadPlugin(id: number) {
    this.logger.debug(`Unloading Plugin ${id}`)
    this.loadedPluginsMap.delete(id)
  }

  public trigger(action: keyof DockerClientEvents) {
    if (!action) {
      throw new Error("No action defined!")
    }

    const allLoadedPlugins = this.loadedPluginsMap.values()

    for (const plugin of allLoadedPlugins) {
      this.logger.debug(`Triggering ${action} on ${plugin.name}`)
      if (plugin.events) {
        plugin.events[action]
      }
    }
  }
}
