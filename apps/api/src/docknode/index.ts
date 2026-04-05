import type { DockNodeTreaty } from "@dockstat/docknode/treaty"
import type Logger from "@dockstat/logger"
import { column, type DB, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { treaty } from "@elysiajs/eden"
import type { DockNodeTable } from "./type"

type DockNodeClient = ReturnType<typeof treaty<DockNodeTreaty>>["api"]

class DockNodeHandler {
  private table: QueryBuilder<DockNodeTable>
  private logger: Logger
  private loadedNodes = new Map<number, DockNodeClient>()

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

  private getClient(nodeId: number): DockNodeClient | null {
    return this.loadedNodes.get(nodeId) ?? null
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

  /** List all stacks on a node */
  async listStacks(nodeId: number) {
    this.logger.info(`Listing stacks on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks.get()
    return result.data
  }

  /** Get a specific stack */
  async getStack(nodeId: number, stackId: number) {
    this.logger.info(`Getting stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).get()
    return result.data
  }

  /** Create a new stack */
  async createStack(
    nodeId: number,
    body: {
      name: string
      yaml: string
      repository: string
      repoName: string
      version: string
      env: Record<string, string | number | boolean | null>
    }
  ) {
    this.logger.info(`Creating stack on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks.post(body)
    return result.data
  }

  /** Update a stack */
  async updateStack(
    nodeId: number,
    stackId: number,
    body: {
      version?: string
      yaml?: string
      env?: Record<string, string | number | boolean | null>
    }
  ) {
    this.logger.info(`Updating stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).patch(body)
    return result.data
  }

  /** Delete a stack */
  async deleteStack(nodeId: number, stackId: number, removeFiles: boolean = true) {
    this.logger.info(`Deleting stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client
      .stacks({ id: stackId })
      .delete({ query: { removeFiles: removeFiles ? "true" : "false" } })
    return result.data
  }

  /** Rename a stack */
  async renameStack(nodeId: number, stackId: number, name: string) {
    this.logger.info(`Renaming stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).rename.patch({ name })
    return result.data
  }

  /** Export a stack */
  async exportStack(nodeId: number, stackId: number) {
    this.logger.info(`Exporting stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).export.get()
    return result.data
  }

  // ---- Stack Lifecycle Operations

  /** Start a stack (docker-compose up) */
  async stackUp(nodeId: number, stackId: number, services?: string[]) {
    this.logger.info(`Starting stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).up.post({ services })
    return result.data
  }

  /** Stop a stack (docker-compose down) */
  async stackDown(
    nodeId: number,
    stackId: number,
    options?: { volumes?: boolean; removeOrphans?: boolean }
  ) {
    this.logger.info(`Stopping stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).down.post(options ?? {})
    return result.data
  }

  /** Stop services in a stack */
  async stackStop(nodeId: number, stackId: number, services?: string[]) {
    this.logger.info(`Stopping services in stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).stop.post({ services })
    return result.data
  }

  /** Restart a stack */
  async stackRestart(nodeId: number, stackId: number, services?: string[]) {
    this.logger.info(`Restarting stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).restart.post({ services })
    return result.data
  }

  /** Pull images for a stack */
  async stackPull(nodeId: number, stackId: number, services?: string[]) {
    this.logger.info(`Pulling images for stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).pull.post({ services })
    return result.data
  }

  /** Get stack status (ps) */
  async stackPs(nodeId: number, stackId: number) {
    this.logger.info(`Getting status for stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.stacks({ id: stackId }).ps.get()
    return result.data
  }

  /** Get stack logs */
  async stackLogs(
    nodeId: number,
    stackId: number,
    options?: { services?: string; follow?: boolean; tail?: number }
  ) {
    this.logger.info(`Getting logs for stack ${stackId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const query: Record<string, string> = {}
    if (options?.services) query.services = options.services
    if (options?.follow) query.follow = "true"
    if (options?.tail) query.tail = String(options.tail)

    const result = await client.stacks({ id: stackId }).logs.get({ query })
    return result.data
  }

  // ============================================
  // Swarm Proxy Methods
  // ============================================

  /** Get swarm status */
  async getSwarmStatus(nodeId: number) {
    this.logger.info(`Getting swarm status on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.status.get()
    return result.data
  }

  /** List swarm stacks */
  async listSwarmStacks(nodeId: number) {
    this.logger.info(`Listing swarm stacks on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.stacks.get()
    return result.data
  }

  /** Get a specific swarm stack */
  async getSwarmStack(nodeId: number, name: string) {
    this.logger.info(`Getting swarm stack ${name} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.stacks({ name }).get()
    return result.data
  }

  /** Deploy a swarm stack */
  async deploySwarmStack(
    nodeId: number,
    body: {
      name: string
      composeFile: string
      withRegistryAuth?: boolean
      prune?: boolean
      resolveImage?: "always" | "changed" | "never"
    }
  ) {
    this.logger.info(`Deploying swarm stack on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.stacks.deploy.post(body)
    return result.data
  }

  /** Remove a swarm stack */
  async removeSwarmStack(nodeId: number, name: string, prune: boolean = false) {
    this.logger.info(`Removing swarm stack ${name} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm
      .stacks({ name })
      .delete({ query: { prune: prune ? "true" : "false" } })
    return result.data
  }

  /** List swarm services */
  async listSwarmServices(nodeId: number) {
    this.logger.info(`Listing swarm services on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.services.get()
    return result.data
  }

  /** Get a specific swarm service */
  async getSwarmService(nodeId: number, serviceId: string) {
    this.logger.info(`Getting swarm service ${serviceId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.services({ id: serviceId }).get()
    return result.data
  }

  /** Scale a swarm service */
  async scaleSwarmService(nodeId: number, serviceId: string, replicas: number) {
    this.logger.info(`Scaling swarm service ${serviceId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.services({ id: serviceId }).scale.post({ replicas })
    return result.data
  }

  /** Update a swarm service */
  async updateSwarmService(
    nodeId: number,
    serviceId: string,
    body: {
      image?: string
      env?: Record<string, string | number | boolean | null>
      replicas?: number
      constraints?: string[]
      labels?: Record<string, string>
    }
  ) {
    this.logger.info(`Updating swarm service ${serviceId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.services({ id: serviceId }).patch(body)
    return result.data
  }

  /** Remove a swarm service */
  async removeSwarmService(nodeId: number, serviceId: string) {
    this.logger.info(`Removing swarm service ${serviceId} on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.services({ id: serviceId }).delete()
    return result.data
  }

  /** List swarm nodes */
  async listSwarmNodes(nodeId: number) {
    this.logger.info(`Listing swarm nodes on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.nodes.get()
    return result.data
  }

  /** Get swarm tasks */
  async listSwarmTasks(nodeId: number, serviceId?: string) {
    this.logger.info(`Listing swarm tasks on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const query = serviceId ? { serviceId } : {}
    const result = await client.swarm.tasks.get({ query })
    return result.data
  }

  /** Initialize swarm */
  async initSwarm(
    nodeId: number,
    body: {
      advertiseAddr?: string
      listenAddr?: string
      forceNewCluster?: boolean
    }
  ) {
    this.logger.info(`Initializing swarm on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.init.post(body)
    return result.data
  }

  /** Leave swarm */
  async leaveSwarm(nodeId: number, force: boolean = false) {
    this.logger.info(`Leaving swarm on node ${nodeId}`)
    const client = this.getClient(nodeId)
    if (!client) throw new Error(`DockNode ${nodeId} not found`)

    const result = await client.swarm.leave.post({ query: { force: force ? "true" : "false" } })
    return result.data
  }
}

export default DockNodeHandler
