import type Logger from "@dockstat/logger"
import type PluginHandler from "@dockstat/plugin-handler"
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DOCKER, EVENTS } from "@dockstat/typings"
import type { buildMessageFromProxyRes } from "@dockstat/typings/types"
import { worker as workerUtils } from "@dockstat/utils"
import type { PoolMetrics, WorkerMetrics } from "../types"
import type {
  DBType,
  DockerClientTable,
  DockerClientTableQuery,
  EventMessage,
  WorkerRequest,
  WorkerWrapper,
} from "./types"
import {
  isInitCompleteMessage,
  isInternalWorkerMessage,
  isProxyEventEnvelope,
  looksLikeEventMessage,
} from "./types"

export class DockerClientManagerCore {
  readonly table: DockerClientTableQuery
  readonly db: DBType
  readonly logger
  readonly workers: Map<number, WorkerWrapper> = new Map()
  readonly maxWorkers: number
  readonly dbPath: string
  readonly events: Map<number, Partial<EVENTS>> = new Map()
  readonly serverHooks: Map<number, { table: QueryBuilder; logger: Logger }> = new Map()
  readonly pluginHandler: PluginHandler

  constructor(
    db: DBType,
    pluginHandler: PluginHandler,
    logger: Logger,
    options: {
      maxWorkers?: number
      events?: Map<number, Partial<EVENTS>>
    }
  ) {
    this.logger = logger.spawn("DCM")
    this.logger.info("Creating Docker Client Manager")
    this.dbPath = db.getDb().filename
    this.db = db
    this.maxWorkers = Number(options.maxWorkers || 4)
    this.pluginHandler = pluginHandler

    const ev = pluginHandler.getHookHandlers()

    if (ev) {
      for (const [pluginId, pluginEvents] of ev) {
        this.logger.debug(`Registering events for plugin ${pluginId}`)
        this.events.set(pluginId, pluginEvents)
      }
    }

    this.table = db.createTable<DockerClientTable>(
      "docker_clients",
      {
        id: column.id(),
        name: column.text({ unique: true }),
        options: column.json(),
      },
      {
        ifNotExists: true,
        parser: { JSON: ["options"] },
      }
    )

    this.logger.info("Initialized DB")
    this.logger.debug("Creating Workers for already existing Clients")

    const clients = this.table.select(["*"]).all()

    for (const c of clients) {
      if (!c.id) {
        this.logger.warn(`Skipping client without id in DB row: ${JSON.stringify(c)}`)
        continue
      }
      this.createWorker(c.id, c.name, c.options)
    }

    this.logger.info(`Initialized with max ${this.maxWorkers} workers, DB path: ${this.dbPath}`)
  }

  // ---------- Client registration ----------

  public async registerClient(name: string, options: DOCKER.DockerAdapterOptions = {}) {
    let dbStepDone = false
    try {
      this.logger.info(`Registering client: ${name}`)

      this.table.insert({ name, options })

      const { id: clientId } = this.table.select(["id"]).where({ name }).first() ?? {}

      if (!clientId) {
        throw new Error(`No client with the name ${name} found in the DB`)
      }

      dbStepDone = true
      this.logger.debug("Client added to DB")

      await this.createWorker(clientId, name, options)

      const msg = `Client ${name} successfully registered with ID: ${clientId}`

      this.logger.info(msg)
      return {
        success: true,
        message: msg,
        clientId,
      }
    } catch (error: unknown) {
      const extra = dbStepDone
        ? ", the Client was already registered in the DB. It will be automatically removed"
        : ""
      const msg = `Error while registering Client ${name}${extra} - error: ${JSON.stringify(error)}`

      this.logger.error(msg)
      if (dbStepDone) {
        this.table.where({ name }).delete()
        this.logger.info("Orphan Client has been removed")
      }

      return {
        success: false,
        error,
        message: msg,
      }
    }
  }

  // ---------- Worker lifecycle ----------

  public async createWorker(
    clientId: number,
    clientName: string,
    options: DOCKER.DockerAdapterOptions
  ): Promise<void> {
    try {
      if (this.workers.size >= this.maxWorkers) {
        throw new Error(`Maximum number of workers (${this.maxWorkers}) reached`)
      }

      this.logger.debug(`Creating worker for client ${clientId}`)

      const worker = new Worker(new URL("../_worker.index.ts", import.meta.url))

      this.logger.debug("Created Worker")

      const wrapper: WorkerWrapper = {
        worker,
        clientId,
        clientName,
        hostIds: new Set(),
        busy: false,
        lastUsed: Date.now(),
        initialized: false,
        lastError: null,
        errorCount: 0,
        serverHooks: this.serverHooks,
      }

      worker.addEventListener("error", (error: ErrorEvent) => {
        this.logger.error(`Worker ${clientId} error: ${JSON.stringify(error)}`)

        const existing = this.workers.get(clientId)
        if (existing) {
          const err = error.error
          existing.lastError = err instanceof Error ? err.message : String(err ?? error)
          existing.errorCount += 1
        }

        this.handleWorkerError(clientId, error)
      })

      this.workers.set(clientId, wrapper)

      // Persistent plugin event listener
      this.attachEventListener(wrapper)

      // Initialize worker
      await this.initializeWorker(clientId, clientName, options)

      // NOTE: hostIds will be populated by the hosts mixin after initialization
    } catch (error: unknown) {
      this.logger.error(`Could not Create worker! ${error}`)
      throw new Error(error as string)
    }
  }

  readonly initializeWorker = async (
    clientId: number,
    clientName: string,
    options: DOCKER.DockerAdapterOptions
  ): Promise<void> => {
    const wrapper = this.workers.get(clientId)
    if (!wrapper) {
      throw new Error(`Worker ${clientId} not found`)
    }
    this.logger.debug("Found Wrapper")

    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>

      const initHandler = (event: MessageEvent) => {
        const message = event.data

        this.logger.debug(`Init handler received: ${JSON.stringify(message)}`)

        if (!isInitCompleteMessage(message)) {
          return
        }

        clearTimeout(timeoutId)
        wrapper.worker.removeEventListener("message", initHandler)

        if (message.success) {
          wrapper.initialized = true
          this.logger.info(`Worker ${clientId} initialized successfully`)
          resolve()
        } else {
          wrapper.lastError = message.error ?? "Unknown init error"
          wrapper.errorCount += 1

          try {
            wrapper.worker.terminate()
          } catch {
            // ignore
          }
          this.workers.delete(clientId)

          reject(new Error(`Worker init failed: ${message.error ?? "unknown"}`))
        }
      }

      this.logger.debug("Setting Worker Initialization Timeout")
      timeoutId = setTimeout(() => {
        try {
          if (!wrapper.initialized) {
            this.logger.warn("Worker is not initialized")
            wrapper.worker.terminate()
            this.logger.debug("Terminated Worker")
            this.workers.delete(clientId)
            this.logger.debug("Deleted Worker from Map")
            wrapper.lastError = "Worker initialization timeout reached"
            wrapper.errorCount += 1
          }
        } catch {
          wrapper.lastError = "Worker initialization timeout failed"
          wrapper.errorCount += 1
          wrapper.worker.terminate()
          this.logger.debug("Terminated Worker")
          this.workers.delete(clientId)
          this.logger.debug("Deleted Worker from Map")
        }
      }, 30000)

      this.logger.debug("Adding message Event Listener")
      wrapper.worker.addEventListener("message", initHandler)

      wrapper.worker.postMessage({
        type: "__init__",
        clientId,
        clientName,
        dbPath: this.dbPath,
        options,
      })
    })
  }

  readonly handleWorkerError = (clientId: number, error: ErrorEvent) => {
    const wrapper = this.workers.get(clientId)
    if (!wrapper) return

    try {
      if (wrapper.messageListener) {
        wrapper.worker.removeEventListener("message", wrapper.messageListener)
        wrapper.messageListener = undefined
      }
    } catch {
      // ignore
    }

    try {
      wrapper.worker.terminate()
    } catch {
      // ignore
    }
    this.workers.delete(clientId)

    this.logger.error(`Worker ${clientId} terminated due to error: ${error.message}`)
  }

  readonly sendRequest = async <T>(clientId: number, request: WorkerRequest): Promise<T> => {
    const wrapper = this.workers.get(clientId)
    if (!wrapper) {
      throw new Error(`No worker found for client ID: ${clientId}`)
    }

    if (!wrapper.initialized) {
      throw new Error(`Worker ${clientId} not initialized`)
    }

    return new Promise<T>((resolve, reject) => {
      wrapper.busy = true
      wrapper.lastUsed = Date.now()

      let settled = false
      let timeoutId: ReturnType<typeof setTimeout>

      const finalize = () => {
        wrapper.busy = false
      }

      const messageHandler = (event: MessageEvent) => {
        const raw = event.data

        if (isInternalWorkerMessage(raw)) {
          return
        }

        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        finalize()
        wrapper.worker.removeEventListener("message", messageHandler)

        const response = raw

        if (response.success) {
          resolve(response.data)
        } else {
          wrapper.lastError = response.error ?? "Unknown worker error"
          wrapper.errorCount += 1
          reject(new Error(response.error ?? "Unknown worker error"))
        }
      }

      timeoutId = setTimeout(() => {
        if (settled) return
        settled = true
        finalize()
        wrapper.lastError = "Request timeout"
        wrapper.errorCount += 1
        wrapper.worker.removeEventListener("message", messageHandler)
        reject(new Error("Request timeout"))
      }, 30000)

      wrapper.worker.addEventListener("message", messageHandler)

      try {
        wrapper.worker.postMessage(request)
      } catch (err) {
        clearTimeout(timeoutId)
        finalize()
        wrapper.worker.removeEventListener("message", messageHandler)

        wrapper.lastError = err instanceof Error ? err.message : String(err)
        wrapper.errorCount += 1

        reject(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }

  // ---------- Client management ----------

  public getClient(clientId: number): boolean {
    return this.workers.has(clientId)
  }

  public getAllClients(all = false): Array<{ id: number; name: string; initialized: boolean }> {
    const liveMap = new Map<number, { id: number; name: string; initialized: true }>()
    for (const w of this.workers.values()) {
      liveMap.set(Number(w.clientId), {
        id: Number(w.clientId),
        name: w.clientName ?? String(w.clientId),
        initialized: true,
      })
    }

    if (!all) {
      return Array.from(liveMap.values())
    }

    const storedClients = this.table.select(["id", "name"]).all() as Array<{
      id: number | string
      name: string
    }>

    const resultMap = new Map<number, { id: number; name: string; initialized: boolean }>()

    for (const { id, name } of storedClients) {
      const numId = Number(id)
      const live = liveMap.get(numId)
      resultMap.set(numId, {
        id: numId,
        name: live?.name ?? name,
        initialized: Boolean(live),
      })
    }

    for (const [id, live] of liveMap.entries()) {
      if (!resultMap.has(id)) {
        resultMap.set(id, live)
      }
    }

    return Array.from(resultMap.values())
  }

  public async removeClient(clientId: number): Promise<void> {
    const wrapper = this.workers.get(clientId)
    if (!wrapper) {
      throw new Error(`No worker found for client ID: ${clientId}`)
    }

    try {
      await this.sendRequest(clientId, { type: "cleanup" })
    } catch (error) {
      this.logger.warn(`Error cleaning up worker ${clientId}: ${String(error)}`)
    }

    try {
      if (wrapper.messageListener) {
        wrapper.worker.removeEventListener("message", wrapper.messageListener)
        wrapper.messageListener = undefined
      }
    } catch {
      // ignore
    }

    try {
      wrapper.worker.terminate()
    } catch {
      // ignore
    }
    this.workers.delete(clientId)

    this.table.where({ id: clientId }).delete()

    this.logger.info(`Client ${clientId} removed`)
  }

  // ---------- Event listening & dispatch ----------

  public attachEventListener(wrapper: WorkerWrapper): void {
    if (wrapper.messageListener) return

    const { worker, clientId, clientName } = wrapper

    const listener = (event: MessageEvent) => {
      const payload = event.data

      let message: EventMessage<keyof EVENTS>

      if (isProxyEventEnvelope(payload)) {
        try {
          message = workerUtils.buildMessage.buildMessageFromProxy(payload) as EventMessage
        } catch (err) {
          this.logger.debug(
            `Failed to build message from proxy for worker ${clientId} (${clientName}): ${String(
              err
            )}`
          )
          return
        }
      } else if (looksLikeEventMessage(payload)) {
        message = payload
      } else {
        try {
          message = workerUtils.buildMessage.buildMessageFromProxy(payload) as EventMessage
        } catch {
          this.logger.debug(
            `Received unknown message format from worker ${clientId} (${clientName}): ${JSON.stringify(
              payload
            )}`
          )
          return
        }
      }

      this.triggerHooks(message)
    }

    worker.addEventListener("message", listener)
    wrapper.messageListener = listener
  }

  public listenForEvents({ eventType, clientId }: { clientId?: string; eventType: keyof EVENTS }) {
    // Current implementation does not filter by eventType/clientId;
    // it simply ensures listeners are attached.
    if (!eventType && !clientId) {
      for (const wrapper of this.workers.values()) {
        const { clientId: id, clientName, messageListener } = wrapper
        this.logger.debug(`Setting up listening for events on worker ${id} (${clientName})`)
        if (!messageListener) {
          this.attachEventListener(wrapper)
        } else {
          this.logger.debug(`Worker ${id} already has event listener attached`)
        }
        this.logger.debug(`Listening for events on worker ${id}`)
      }
    }
  }

  readonly triggerHooks = <K extends keyof EVENTS>(message: buildMessageFromProxyRes<K>) => {
    if (!message.type) {
      this.logger.error(`No message type! ${JSON.stringify(message)}`)
    }

    this.logger.debug(
      `Triggering hooks for event "${String(message.type)} - ctx: ${JSON.stringify(message.ctx)}"`
    )

    this.logger.debug(`${this.events.size} Events registered`)

    for (const [id, hooks] of this.events.entries()) {
      const serverHooks = this.pluginHandler.getServerHooks(id)

      if (!hooks) {
        this.logger.warn(`No hooks found for plugin ${id}`)
        continue
      }

      this.logger.debug(`Found ${JSON.stringify(Object.keys(hooks))}`)

      if (!serverHooks) {
        this.logger.warn(`No server hooks found for plugin ${id}`)
        continue
      }

      const hook = hooks[message.type]

      if (!hook) {
        this.logger.debug(`No hook for event "${String(message.type)}"`)
        continue
      }

      if (typeof hook !== "function") {
        this.logger.error(`Invalid hook for event "${String(message.type)}"`)
        continue
      }

      try {
        if (message.additionalCtx) {
          // biome-ignore lint/suspicious/noExplicitAny: Custom plugin typings and contexts typings as any
          hook(message.ctx as any, message.additionalCtx as any, serverHooks)
        } else {
          // biome-ignore lint/suspicious/noExplicitAny: Custom plugin typings and contexts typings as any
          hook(message.ctx as any, serverHooks)
        }
      } catch (err: unknown) {
        this.logger.error(
          `Error in plugin event handler for event "${String(message.type)}": ${JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}))}`
        )
      }
    }
  }

  public async isMonitoring(clientId: number): Promise<boolean> {
    const _ = clientId
    // Default behavior: assume not monitoring. MonitoringMixin overrides this.
    return false
  }

  public async getAllHosts(): Promise<Array<{ name: string; id: number; clientId: number }>> {
    // Default behavior: no hosts known at core level. HostsMixin overrides this.
    return []
  }

  // ---------- Pool metrics & status ----------

  public async getPoolMetrics(): Promise<PoolMetrics> {
    const workers: WorkerMetrics[] = []
    let totalHosts = 0

    for (const [clientId, wrapper] of this.workers) {
      totalHosts += wrapper.hostIds.size

      let isMonitoring = false
      try {
        // Implemented in MonitoringMixin
        isMonitoring = await this.isMonitoring(clientId)
      } catch {
        // Ignore errors
      }

      const workerMetrics: WorkerMetrics = {
        workerId: clientId,
        clientId: wrapper.clientId,
        clientName: wrapper.clientName,
        hostsManaged: wrapper.hostIds.size,
        initialized: wrapper.initialized,
        activeStreams: 0,
        isMonitoring,
        memoryUsage: process.memoryUsage(),
        uptime: Date.now() - wrapper.lastUsed,
      }

      workers.push(workerMetrics)
    }

    return {
      totalWorkers: this.workers.size,
      activeWorkers: Array.from(this.workers.values()).filter((w) => !w.busy).length,
      totalHosts,
      totalClients: this.workers.size,
      averageHostsPerWorker: this.workers.size > 0 ? totalHosts / this.workers.size : 0,
      workers,
    }
  }

  public async getStatus() {
    // getAllHosts is implemented in HostsMixin
    const hosts = await this.getAllHosts()
    this.logger.debug("Getting status")
    this.logger.debug(`Hosts: ${JSON.stringify(hosts)}`)
    return {
      ...(await this.getPoolMetrics()),
      hosts,
    }
  }

  public async getWorkerMetrics(clientId: number): Promise<WorkerMetrics | null> {
    const wrapper = this.workers.get(clientId)
    if (!wrapper) return null

    let isMonitoring = false
    try {
      isMonitoring = await this.isMonitoring(clientId)
    } catch {
      // Ignore
    }

    return {
      workerId: clientId,
      clientId: wrapper.clientId,
      clientName: wrapper.clientName,
      hostsManaged: wrapper.hostIds.size,
      initialized: wrapper.initialized,
      activeStreams: 0,
      isMonitoring,
      memoryUsage: process.memoryUsage(),
      uptime: Date.now() - wrapper.lastUsed,
    }
  }

  // ---------- Cleanup ----------

  public async dispose(): Promise<void> {
    this.logger.info("Disposing DockerClientManager")

    const cleanupPromises = Array.from(this.workers.keys()).map((clientId) =>
      this.removeClient(clientId).catch((err) => {
        this.logger.error(`Error removing client ${clientId}: ${String(err)}`)
      })
    )

    await Promise.allSettled(cleanupPromises)
    this.workers.clear()

    this.logger.info("DockerClientManager disposed")
  }
}
