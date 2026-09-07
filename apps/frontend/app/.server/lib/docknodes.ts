import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockStatConfigTableType } from "@dockstat/typings/types"

export interface DockNodeTable extends Record<string, unknown> {
  id: number
  name: string | null
  host: string | null
  port: number | null
  useSSL: boolean | null
  timeout: number | null
  keys: DockStatConfigTableType["keys"] | null
}

/**
 * Minimal DockNode registry — only what the infra-graph needs.
 * The full node/stacks routes are excluded while @dockstat/docknode is
 * being refactored. Reachability is probed with plain fetch (no treaty).
 */
export class DockNodeHandler {
  private table: QueryBuilder<DockNodeTable>
  private logger: Logger

  constructor(db: DB, logger: Logger) {
    this.logger = logger.spawn("DNH")
    this.table = db.createTable<DockNodeTable>(
      "docknode-register",
      {
        host: column.text(),
        id: column.id(),
        keys: column.foreignKey<DockStatConfigTableType>("config", "keys", {
          references: {
            column: "keys",
            onDelete: "NO ACTION",
            onUpdate: "CASCADE",
            table: "config",
          },
          type: "JSON",
        }),
        name: column.text(),
        port: column.integer(),
        timeout: column.integer({ default: 60 }),
        useSSL: column.boolean(),
      },
      { ifNotExists: true }
    )
    this.logger.info("DockNode-Handler initialized")
  }

  async getAllNodes() {
    const allNodes = this.table.select(["*"]).all()

    return Promise.all(
      allNodes.map(async (n) => {
        if (!n.host || !n.port) return { ...n, isReachable: "DockNode not initialised" }

        try {
          const res = await fetch(`http${n.useSSL ? "s" : ""}://${n.host}:${n.port}/api/status`, {
            signal: AbortSignal.timeout((n.timeout ?? 60) * 1000),
          })
          const state = res.ok ? await res.text() : "NO"
          return { ...n, isReachable: state || "NO" }
        } catch {
          return { ...n, isReachable: "NO" }
        }
      })
    )
  }
}
