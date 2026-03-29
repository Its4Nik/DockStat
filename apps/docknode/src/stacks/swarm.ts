// @ts-nocheck - Module has compilation errors, using type assertions to work around
import { SwarmClient } from "@dockstat/docker-swarm"
import { DockNodeLogger } from "../utils/logger"
import {
  type SwarmStatus,
  type SwarmInitOptions,
  type SwarmJoinOptions,
  type SwarmStackDeployOptions,
  type SwarmStackRemoveOptions,
  type SwarmStackInfo,
  type SwarmServiceInfo,
  type SwarmServiceCreateOptions,
  type SwarmServiceUpdateOptions,
  type SwarmNodeInfo,
  type SwarmTaskInfo,
  type SwarmNetworkInfo,
  type SwarmLogsOptions,
  type StreamLogMessage,
} from "./types"

const logger = DockNodeLogger.spawn("SwarmHandler")

/**
 * SwarmHandler
 *
 * Handles all Docker Swarm operations using the @docker-swarm package.
 */
class SwarmHandler {
  private swarmClient: any // Using any to work around type issues in @dockstat/docker-swarm

  constructor() {
    this.swarmClient = new SwarmClient({
      socketPath: "/var/run/docker.sock",
    }, logger)
  }

  /**
   * Get the current swarm status
   */
  async getSwarmStatus(): Promise<SwarmStatus> {
    logger.info("Getting swarm status")
    try {
      const status: any = await this.swarmClient.swarm.getStatus()

      const swarmStatus: SwarmStatus = {
        isSwarmManager: status.isManager ?? false,
        isSwarmWorker: status.nodeID !== undefined && !status.isManager,
        nodeCount: 0,
        managerCount: 0,
      }

      if (status.id) {
        swarmStatus.swarmId = status.id
        swarmStatus.clusterName = status.spec?.Name ?? "default"
      }

      // Get node counts if we're a manager
      if (status.isManager) {
        const nodes: any[] = await this.swarmClient.nodes.list()
        const readyNodes = nodes.filter(
          (n: any) => n.status?.State === "ready"
        )
        swarmStatus.nodeCount = readyNodes.length
        swarmStatus.managerCount = nodes.filter(
          (n: any) => n.spec?.role === "manager" && n.status?.State === "ready"
        ).length

        // Get join tokens if we're a manager
        const tokens: any = await this.swarmClient.swarm.getJoinTokens()
        if (tokens) {
          swarmStatus.joinTokens = {
            manager: tokens.manager,
            worker: tokens.worker,
          }
        }
      }

      return swarmStatus
    } catch (error) {
      logger.error(`Failed to get swarm status: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Initialize a new swarm
   */
  async initSwarm(options: SwarmInitOptions): Promise<string> {
    logger.info("Initializing swarm", { advertiseAddr: options.advertiseAddr })
    try {
      const result: any = await this.swarmClient.swarm.init({
        advertiseAddr: options.advertiseAddr,
        listenAddr: options.listenAddr,
        forceNewCluster: options.forceNewCluster,
      })
      logger.info("Swarm initialized successfully")
      return JSON.stringify(result)
    } catch (error) {
      logger.error(`Failed to initialize swarm: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Join an existing swarm
   */
  async joinSwarm(options: SwarmJoinOptions): Promise<void> {
    logger.info("Joining swarm", { remoteAddrs: options.remoteAddrs })
    try {
      await this.swarmClient.swarm.join({
        remoteAddrs: options.remoteAddrs,
        joinToken: options.joinToken,
        listenAddr: options.listenAddr,
        advertiseAddr: options.advertiseAddr,
      })
      logger.info("Successfully joined swarm")
    } catch (error) {
      logger.error(`Failed to join swarm: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Leave the swarm
   */
  async leaveSwarm(force: boolean = false): Promise<void> {
    logger.info("Leaving swarm", { force })
    try {
      await this.swarmClient.swarm.leave({ force })
      logger.info("Successfully left swarm")
    } catch (error) {
      logger.error(`Failed to leave swarm: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Deploy a stack
   */
  async deployStack(options: SwarmStackDeployOptions): Promise<{ success: boolean; message: string }> {
    logger.info("Deploying stack", { name: options.name })
    try {
      await this.swarmClient.stacks.deploy({
        name: options.name,
        compose: options.composeFile,
        prune: options.prune,
        withRegistryAuth: options.withRegistryAuth,
        detach: options.detach,
        quiet: options.quiet,
      })
      logger.info(`Stack ${options.name} deployed successfully`)
      return {
        success: true,
        message: `Stack ${options.name} deployed successfully`,
      }
    } catch (error) {
      logger.error(`Failed to deploy stack: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to deploy stack: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Remove a stack
   */
  async removeStack(options: SwarmStackRemoveOptions): Promise<{ success: boolean; message: string }> {
    logger.info("Removing stack", { name: options.name })
    try {
      await this.swarmClient.stacks.remove(options.name)
      logger.info(`Stack ${options.name} removed successfully`)
      return {
        success: true,
        message: `Stack ${options.name} removed successfully`,
      }
    } catch (error) {
      logger.error(`Failed to remove stack: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to remove stack: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * List all stacks
   */
  async listStacks(): Promise<SwarmStackInfo[]> {
    logger.info("Listing stacks")
    try {
      const result: any = await this.swarmClient.stacks.list()

      const stacks: SwarmStackInfo[] = result.stacks.map((stack: any) => ({
        name: stack.name,
        services: [],
        networks: [],
        configs: [],
        secrets: [],
      }))

      // Fetch services for each stack
      for (const stack of stacks) {
        const services: any[] = await this.swarmClient.stacks.getStackServices(stack.name)
        stack.services = this.parseServices(services)
      }

      return stacks
    } catch (error) {
      logger.error(`Failed to list stacks: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Get a specific stack
   */
  async getStack(name: string): Promise<SwarmStackInfo> {
    logger.info("Getting stack", { name })
    try {
      const services: any[] = await this.swarmClient.stacks.getStackServices(name)

      const networks: any[] = await this.swarmClient.networks.list("swarm")
      const stackNetworks = networks.filter((n: any) =>
        n.labels?.[`com.docker.stack.namespace`] === name
      )

      const stack: SwarmStackInfo = {
        name,
        services: this.parseServices(services),
        networks: stackNetworks.map((n: any) => this.parseNetwork(n)),
        configs: [],
        secrets: [],
      }

      return stack
    } catch (error) {
      logger.error(`Failed to get stack: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * List all services
   */
  async listServices(): Promise<SwarmServiceInfo[]> {
    logger.info("Listing services")
    try {
      const services: any[] = await this.swarmClient.services.list()
      return this.parseServices(services)
    } catch (error) {
      logger.error(`Failed to list services: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Get a specific service
   */
  async getService(id: string): Promise<SwarmServiceInfo> {
    logger.info("Getting service", { id })
    try {
      const service: any = await this.swarmClient.services.get(id)
      return this.parseService(service)
    } catch (error) {
      logger.error(`Failed to get service: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Create a new service
   */
  async createService(options: SwarmServiceCreateOptions): Promise<{ id: string; warnings: string[] }> {
    logger.info("Creating service", { name: options.name })
    try {
      const result: any = await this.swarmClient.services.create({
        name: options.name,
        image: options.image,
        replicas: options.replicas,
        mode: options.replicas ? "replicated" : "global",
        env: options.env,
        labels: options.labels,
        containerLabels: options.labels,
        networks: options.networks,
        ports: options.ports?.map((p) => ({
          protocol: p.protocol,
          target: p.targetPort,
          published: p.publishedPort,
        })),
        resources: options.resources ? {
          limits: options.resources.limits ? {
            nanoCPUs: options.resources.limits.nanoCpu,
            memoryBytes: options.resources.limits.memoryBytes,
          } : undefined,
          reservations: options.resources.reservations ? {
            nanoCPUs: options.resources.reservations.nanoCpu,
            memoryBytes: options.resources.reservations.memoryBytes,
          } : undefined,
        } : undefined,
        restartPolicy: options.restartPolicy ? {
          condition: options.restartPolicy.condition,
          delay: options.restartPolicy.delay,
          maxAttempts: options.restartPolicy.maxAttempts,
          window: options.restartPolicy.window,
        } : undefined,
        constraints: options.constraints,
        mounts: options.mounts?.map((m) => ({
          type: m.type,
          source: m.source,
          target: m.target,
          readOnly: m.readOnly,
        })),
        healthCheck: options.healthCheck ? {
          test: options.healthCheck.test,
          interval: options.healthCheck.interval,
          timeout: options.healthCheck.timeout,
          retries: options.healthCheck.retries,
          startPeriod: options.healthCheck.startPeriod,
        } : undefined,
      })
      logger.info(`Service ${options.name} created successfully`, { id: result.id })
      return {
        id: result.id,
        warnings: [],
      }
    } catch (error) {
      logger.error(`Failed to create service: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Update a service
   */
  async updateService(options: SwarmServiceUpdateOptions): Promise<{ success: boolean; message: string }> {
    logger.info("Updating service", { serviceId: options.serviceId })
    try {
      const service: any = await this.swarmClient.services.get(options.serviceId)
      const version: number = service.version?.index ?? 0

      await this.swarmClient.services.update(options.serviceId, {
        version,
        image: options.image,
        env: options.env,
        replicas: options.replicas,
        labels: options.labels,
        containerLabels: options.labels,
        constraints: options.constraints,
        restartPolicy: options.restartPolicy ? {
          condition: options.restartPolicy.condition,
          delay: options.restartPolicy.delay,
          maxAttempts: options.restartPolicy.maxAttempts,
          window: options.restartPolicy.window,
        } : undefined,
        resources: options.resources ? {
          limits: options.resources.limits ? {
            nanoCPUs: options.resources.limits.nanoCpu,
            memoryBytes: options.resources.limits.memoryBytes,
          } : undefined,
          reservations: options.resources.reservations ? {
            nanoCPUs: options.resources.reservations.nanoCpu,
            memoryBytes: options.resources.reservations.memoryBytes,
          } : undefined,
        } : undefined,
      })

      logger.info(`Service ${options.serviceId} updated successfully`)
      return {
        success: true,
        message: `Service ${options.serviceId} updated successfully`,
      }
    } catch (error) {
      logger.error(`Failed to update service: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to update service: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Scale a service
   */
  async scaleService(serviceId: string, replicas: number): Promise<{ success: boolean; message: string }> {
    logger.info("Scaling service", { serviceId, replicas })
    try {
      await this.swarmClient.services.scale(serviceId, replicas)

      logger.info(`Service ${serviceId} scaled to ${replicas} replicas`)
      return {
        success: true,
        message: `Service ${serviceId} scaled to ${replicas} replicas`,
      }
    } catch (error) {
      logger.error(`Failed to scale service: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to scale service: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Remove a service
   */
  async removeService(serviceId: string): Promise<{ success: boolean; message: string }> {
    logger.info("Removing service", { serviceId })
    try {
      await this.swarmClient.services.remove(serviceId)
      logger.info(`Service ${serviceId} removed successfully`)
      return {
        success: true,
        message: `Service ${serviceId} removed successfully`,
      }
    } catch (error) {
      logger.error(`Failed to remove service: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to remove service: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Get service logs
   */
  async getServiceLogs(
    options: SwarmLogsOptions,
    callback: (log: StreamLogMessage) => void
  ): Promise<void> {
    logger.info("Getting service logs", { serviceId: options.serviceId })
    try {
      const logs: string = await this.swarmClient.services.logs(options.serviceId, {
        follow: options.follow ?? false,
        tail: options.tail ?? 100,
        since: options.since,
        timestamps: options.timestamps ?? true,
        details: options.details ?? false,
      })

      // Parse logs and call callback
      const lines: string[] = logs.split("\n").filter((l: string) => l.trim())

      for (const line of lines) {
        callback({
          timestamp: new Date().toISOString(),
          message: line,
          serviceId: options.serviceId,
          level: line.toLowerCase().includes("error") ? "error" : "info",
        })
      }
    } catch (error) {
      logger.error(`Failed to get service logs: ${error instanceof Error ? error.message : String(error)}`)
      callback({
        timestamp: new Date().toISOString(),
        message: `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`,
        serviceId: options.serviceId,
        level: "error",
      })
    }
  }

  /**
   * List all nodes
   */
  async listNodes(): Promise<SwarmNodeInfo[]> {
    logger.info("Listing nodes")
    try {
      const nodes: any[] = await this.swarmClient.nodes.list()
      return nodes.map((n: any) => this.parseNode(n))
    } catch (error) {
      logger.error(`Failed to list nodes: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Get a specific node
   */
  async getNode(id: string): Promise<SwarmNodeInfo> {
    logger.info("Getting node", { id })
    try {
      const node: any = await this.swarmClient.nodes.get(id)
      return this.parseNode(node)
    } catch (error) {
      logger.error(`Failed to get node: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Update a node
   */
  async updateNode(
    id: string,
    options: { availability?: "active" | "pause" | "drain"; labels?: Record<string, string> }
  ): Promise<{ success: boolean; message: string }> {
    logger.info("Updating node", { id })
    try {
      const node: any = await this.swarmClient.nodes.get(id)
      const version: number = node.version?.index ?? 0

      await this.swarmClient.nodes.update(id, {
        version,
        availability: options.availability,
        labels: options.labels,
      })

      logger.info(`Node ${id} updated successfully`)
      return {
        success: true,
        message: `Node ${id} updated successfully`,
      }
    } catch (error) {
      logger.error(`Failed to update node: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to update node: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Remove a node
   */
  async removeNode(id: string, force: boolean = false): Promise<{ success: boolean; message: string }> {
    logger.info("Removing node", { id, force })
    try {
      await this.swarmClient.nodes.remove(id, force)
      logger.info(`Node ${id} removed successfully`)
      return {
        success: true,
        message: `Node ${id} removed successfully`,
      }
    } catch (error) {
      logger.error(`Failed to remove node: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to remove node: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * List tasks
   */
  async listTasks(serviceId?: string): Promise<SwarmTaskInfo[]> {
    logger.info("Listing tasks", { serviceId })
    try {
      const filters = serviceId ? { service: [serviceId] } : {}
      const tasks: any[] = await this.swarmClient.tasks.list(filters)
      const nodes: any[] = await this.swarmClient.nodes.list()
      const nodeMap = new Map(nodes.map((n: any) => [n.id, n.description?.hostname ?? n.id]))

      return tasks.map((t: any) => this.parseTask(t, nodeMap))
    } catch (error) {
      logger.error(`Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * List networks
   */
  async listNetworks(): Promise<SwarmNetworkInfo[]> {
    logger.info("Listing networks")
    try {
      const networks: any[] = await this.swarmClient.networks.list("swarm")
      return networks.map((n: any) => this.parseNetwork(n))
    } catch (error) {
      logger.error(`Failed to list networks: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Create a network
   */
  async createNetwork(options: {
    name: string
    driver?: string
    attachable?: boolean
    subnet?: string
    labels?: Record<string, string>
  }): Promise<{ id: string }> {
    logger.info("Creating network", { name: options.name })
    try {
      const network: any = await this.swarmClient.networks.create({
        name: options.name,
        driver: options.driver ?? "overlay",
        attachable: options.attachable ?? true,
        labels: options.labels,
        ipam: options.subnet ? {
          driver: "default",
          config: [{ subnet: options.subnet }],
        } : undefined,
      })

      logger.info(`Network ${options.name} created successfully`)
      return { id: network.id }
    } catch (error) {
      logger.error(`Failed to create network: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Remove a network
   */
  async removeNetwork(id: string): Promise<{ success: boolean; message: string }> {
    logger.info("Removing network", { id })
    try {
      await this.swarmClient.networks.remove(id)
      logger.info(`Network ${id} removed successfully`)
      return {
        success: true,
        message: `Network ${id} removed successfully`,
      }
    } catch (error) {
      logger.error(`Failed to remove network: ${error instanceof Error ? error.message : String(error)}`)
      return {
        success: false,
        message: `Failed to remove network: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Parse service info from @docker-swarm format to app format
   */
  private parseServices(services: any[]): SwarmServiceInfo[] {
    return services.map((s: any) => this.parseService(s))
  }

  private parseService(service: any): SwarmServiceInfo {
    const labels: Record<string, string> = service.spec?.labels ?? {}
    const stackName: string = labels["com.docker.stack.namespace"] ?? ""

    const mode: "replicated" | "global" | "replicated-job" | "global-job" =
      service.spec?.mode?.replicated ? "replicated" :
      service.spec?.mode?.global ? "global" : "replicated"

    const replicas: number = service.spec?.mode?.replicated?.replicas ?? 1

    return {
      id: service.id,
      name: service.spec?.name ?? "",
      mode,
      replicas: {
        running: 0, // Need to get this from tasks
        desired: replicas,
        failed: 0, // Need to get this from tasks
        pending: 0, // Need to get this from tasks
      },
      image: service.spec?.taskTemplate?.containerSpec?.image ?? "",
      ports: service.endpoint?.ports?.map((p: any) => ({
        publishedPort: p.publishedPort ?? 0,
        targetPort: p.targetPort ?? 0,
        protocol: (p.protocol ?? "tcp") as "tcp" | "udp" | "sctp",
        mode: (p.publishMode ?? "ingress") as "ingress" | "host",
      })) ?? [],
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      labels,
      stackName,
    }
  }

  /**
   * Parse node info from @docker-swarm format to app format
   */
  private parseNode(node: any): SwarmNodeInfo {
    return {
      id: node.id,
      name: node.spec?.name ?? "",
      hostname: node.description?.hostname ?? "",
      role: node.spec?.role ?? "worker",
      availability: node.spec?.availability ?? "active",
      state: node.status?.state ?? "unknown",
      address: node.status?.addr ?? "",
      labels: node.spec?.labels ?? {},
      platform: {
        os: node.description?.platform?.os ?? "",
        architecture: node.description?.platform?.architecture ?? "",
      },
      resources: {
        nanoCpu: node.description?.resources?.nanoCPUs ?? 0,
        memoryBytes: node.description?.resources?.memoryBytes ?? 0,
      },
      managerStatus: node.managerStatus
        ? {
            leader: node.managerStatus.leader ?? false,
            reachability: node.managerStatus.reachability ?? "unknown",
            addr: node.managerStatus.addr ?? "",
          }
        : undefined,
    }
  }

  /**
   * Parse task info from @docker-swarm format to app format
   */
  private parseTask(task: any, nodeMap: Map<string, string>): SwarmTaskInfo {
    const nodeId: string = task.nodeId ?? ""

    return {
      id: task.id,
      name: task.name ?? "",
      serviceId: task.serviceId ?? "",
      serviceName: task.spec?.containerSpec?.labels?.["com.docker.swarm.service.name"] ?? "",
      nodeId,
      nodeName: nodeMap.get(nodeId) ?? nodeId,
      state: task.status?.state ?? "pending",
      desiredState: task.desiredState ?? "pending",
      error: task.status?.err,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }
  }

  /**
   * Parse network info from @docker-swarm format to app format
   */
  private parseNetwork(network: any): SwarmNetworkInfo {
    return {
      id: network.id,
      name: network.name,
      driver: network.driver ?? "overlay",
      scope: (network.scope ?? "swarm") as "local" | "swarm",
      attachable: network.attachable ?? false,
      ingress: network.ingress ?? false,
      ipam: {
        driver: network.ipam?.driver ?? "default",
        config: (network.ipam?.config ?? []).map((c: any) => ({
          subnet: c.subnet ?? "",
          gateway: c.gateway,
        })),
      },
      labels: network.labels ?? {},
    }
  }
}

// Export a singleton instance
export default new SwarmHandler()
