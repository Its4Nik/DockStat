import type DB from "@dockstat/sqlite-wrapper";
import type { PLUGIN } from "@dockstat/typings"
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper";

class PluginHandler {
  private DB: DB
  private table: QueryBuilder<PLUGIN.PluginTable>

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

  getPluginBlob(id: number) {
    const plugin = this.table.select(["*"]).where({ id: id }).first()
    const tmp: Record<string, Blob> = {}

    if (!plugin) {
      throw new Error(`Plugin with id ${id} not found`)
    }

    if (plugin.backend) {
      tmp.backend = plugin.backend
    }

    if (plugin.component) {
      tmp.component = plugin.component
    }

    return
  }
}
