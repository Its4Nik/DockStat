import type { DockNodeTreaty } from "@dockstat/docknode/treaty"
import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { treaty } from "@elysiajs/eden"
import type { DockNodeTable } from "./type"

class DockNodeHandler {
  private table: QueryBuilder<DockNodeTable>
  private logger: Logger
  private loadedNodes = new Map<number, ReturnType<typeof treaty<DockNodeTreaty>>["api"]>()

  constructor(DB: DB, logger: Logger) {
    this.logger = logger.spawn("DNH")
    this.table = DB.createTable<DockNodeTable>(
      "docknode-register",
      {
        id: column.id(),
        name: column.text(),
        host: column.text(),
        port: column.integer(),
        useSSL: column.boolean(),
        keys: column.foreignKey<DockStatConfigTableType>("config", "keys", {
          references: {
            onDelete: "NO ACTION",
            onUpdate: "CASCADE",
            column: "keys",
            table: "config",
          },
          type: "JSON",
        }),
        timeout: column.integer({ default: 60 }),
      },
      { ifNotExists: true }
    )

    this.logger.info("DockNode-Hanlder initialising")

    const allDockNodeClients = this.table.select(["*"]).all()

    for (const node of allDockNodeClients) {
      this.loadedNodes.set(
        Number(node.id),
        treaty<DockNodeTreaty>(`${node.useSSL ? "https://" : "http://"}${node.host}:${node.port}`)
          .api
      )
    }

    this.logger.info("DockNode-Hanlder initialized.")
  }

  private setLoadedNode(node: DockNodeTable) {
    return this.loadedNodes.set(
      Number(node.id),
      treaty<DockNodeTreaty>(`${node.useSSL ? "https://" : "http://"}${node.host}:${node.port}`).api
    )
  }

  async getAllNodes() {
    this.logger.info("Getting all nodes")
    const allNodes = this.table.select(["*"]).all()

    this.logger.debug(`Got ${allNodes.length} node(s)`)

    const res = await Promise.all(
      allNodes.map(async (n) => {
        this.logger.debug(`Getting online state for ${n.id}`)
        const dnc = this.loadedNodes.get(Number(n.id))

        if (!dnc) {
          return {
            ...n,
            isReachable: "DockNode not initialised",
          }
        }

        const state = (await dnc?.status.get())?.data ?? "NO"

        this.logger.info(`State for ${n.id}: ${state}`)

        return {
          ...n,
          isReachable: state,
        }
      })
    )

    return res
  }

  createNode(cfg: Omit<DockNodeTable, "keys">) {
    const insertRes = this.table.insert(cfg)

    const node = this.table.select(["*"]).where({ id: insertRes.insertId }).first()

    if (node !== null) {
      this.setLoadedNode(node)
    }

    return insertRes
  }

  delteNode(id: number) {
    return this.table.where({ id: id }).delete()
  }
}

export default DockNodeHandler
