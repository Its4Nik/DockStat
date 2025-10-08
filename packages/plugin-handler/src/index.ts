import type DB from "@dockstat/sqlite-wrapper"
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { PLUGIN } from "@dockstat/typings"
import { buildPluginLink, logger, validatePlugin } from "./utils"

class PluginHandler {
  private DB: DB;
  private pluginTable: QueryBuilder<PLUGIN.PluginTable>

  constructor(db: DB) {
    this.DB = db

    this.pluginTable = this.DB.createTable<PLUGIN.PluginTable>("plugin", {
      id: column.id(),
      meta: column.json({ notNull: true }),
      plugin: column.json({})
    })
  }

  private getComponentPath = (fileName: string) => `.components/${fileName}.js`

  getPlugins() {
    return this.pluginTable.select(["*"]).all()
  }

  registerPlugin(plugin: PLUGIN.PluginTable) {
    validatePlugin(plugin)

    const insertRes = this.pluginTable.insertAndGet(plugin)
    if (!insertRes?.id) {
      throw new Error(`Could not register ${plugin.meta.name}`)
    }

    if (plugin.plugin.component) {
      this.writeFrontendComponent(plugin)
    }

    return insertRes
  }

  async updatePlugin(id: number) {
    const plugin = this.pluginTable.select(["*"]).where({ id: id }).first()
    if (!plugin) {
      throw new Error(`Plugin with id: ${id} not found`)
    }
    const newPluginData = await (await fetch(buildPluginLink(plugin.meta.repository, plugin.meta.path))).json() as PLUGIN.PluginTable

    if (plugin.meta.version === newPluginData.meta.version) {
      throw new Error("Plugin Version cannot stay the same when updating")
    }

    const res = this.pluginTable.where({ id: id }).update(newPluginData)

    return res
  }

  deletePlugin(id: number) {
    return this.pluginTable.where({ id: id }).delete()
  }

  private writeFrontendComponent(plugin: PLUGIN.PluginTable) {
    try {
      if (!plugin.plugin.component) {
        logger.debug(`Plugin ${plugin.meta.name} has no Frontend Page`)
        return;
      }

      const file = Bun.file(this.getComponentPath(`${plugin.meta.name}-component`))

      file.write(plugin.plugin.component)
    } catch (error) {
      throw new Error(`${error}`)
    }
  }
}

export default PluginHandler
