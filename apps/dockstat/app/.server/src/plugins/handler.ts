import type DB from "@dockstat/sqlite-wrapper";
import type { PLUGIN } from "@dockstat/typings"
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import { createLogger } from "@dockstat/logger";

export class PluginHandler {
  private DB: DB
  private table: QueryBuilder<PLUGIN.PluginTable>
  private logger = createLogger("PluginHandler")

  constructor(DB: DB) {
    this.DB = DB

    this.table = this.DB.createTable<PLUGIN.PluginTable>("plugins", {
      id: column.id(),
      name: column.text({ notNull: true }),
      version: column.text({ notNull: true, check: "GLOB '[0-9]*.[0-9]*.[0-9]*'" }),
      type: column.enum(["component", "backend", "multi"]),
      component: column.blob({ notNull: false }),
      backend: column.blob({ notNull: false })
    })
  }

  getPluginBlobs(id: number) {
    const plugin = this.table.select(["backend", "component"]).where({ id: id }).first()
    const tmp = new Map<string, Blob>

    if (!plugin) {
      throw new Error(`Plugin with id ${id} not found`)
    }

    plugin.backend && tmp.set("backend", plugin.backend)
    plugin.component && tmp.set('component', plugin.component)

    return tmp
  }

  getSavedPlugins() {
    return this.table.select(["*"]).all()
  }
}
