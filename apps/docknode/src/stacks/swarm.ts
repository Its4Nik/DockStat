import type { EnvMap, SwarmNodeAvailability, SwarmNodeRole, SwarmNodeState, SwarmServiceState } from "./types"
import {
  type SwarmConfigInfo,
  type SwarmInitOptions,
  type SwarmJoinOptions,
  type SwarmLogsOptions,
  type SwarmNetworkInfo,
  type SwarmNodeInfo,
  type SwarmSecretInfo,
  type SwarmServiceCreateOptions,
  type SwarmServiceInfo,
  type SwarmServiceUpdateOptions,
  type SwarmStackDeployOptions,
  type SwarmStackInfo,
  type SwarmStatus,
  type SwarmTaskInfo,
  type StreamLogMessage,
} from "./types"
import { DockNodeLogger } from "../utils/logger"
import Docker from "dockerode"
import { DOCKER_SOCKET_PATH } from "../consts"
import { extractErrorMessage } from "@dockstat/utils"
import { DOCKER } from "@dockstat/typings"

const logger = DockNodeLogger.spawn("Swarm")

/**
 * Handler for Docker Swarm operations
 */
class SwarmHandler {
  private docker: Docker

  constructor() {
    this.docker = new Docker({ socketPath: DOCKER_SOCKET_PATH })
    logger.debug("SwarmHandler initialized")
  }

  // ============================================
  // Swarm Cluster Operations
  // ============================================

  /**
   * Get current swarm status
   */
  async getSwarmStatus(): Promise<SwarmStatus> {
    logger.info("Getting swarm status")
    try {
      const info = await this.docker.info()

      const isSwarmManager = info.Swarm?.ControlAvailable ?? false
      const isSwarmWorker = (info.Swarm?.LocalNodeState === "active" && !isSwarmManager)

      const status: SwarmStatus = {
        isSwarmManager,
        isSwarmWorker,
        nodeCount: info.Swarm?.Nodes ?? 0,
        managerCount: 0,
      }

      if (info.Swarm?.Cluster?.ID) {
        status.swarmId = info.Swarm.Cluster.ID
        status.clusterName = info.Swarm.Cluster.Spec?.Name ?? "default"
      }

      // Get manager count
      if (isSwarmManager) {
        const nodes = await this.docker.listNodes()
        status.managerCount = nodes.filter(
          (n) => n.Spec?.Role === "manager" && n.Status?.State === "ready"
        ).length

        // Get join tokens if we're a manager
        const swarm = await this.docker.getSwarm()
        const swarmInfo = await swarm.inspect()
        status.joinTokens = {
          manager: swarmInfo.JoinTokens?.Manager ?? "",
          worker: swarmInfo.JoinTokens?.Worker ?? "",
        }
      }

      return status
    } catch (error) {
      logger.error(`Failed to get swarm status: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Initialize a new swarm
   */
  async initSwarm(options: SwarmInitOptions): Promise<string> {
    logger.info("Initializing swarm", { advertiseAddr: options.advertiseAddr })
    try {
      const result = await this.docker.initSwarm({
        AdvertiseAddr: options.advertiseAddr,
        ListenAddr: options.listenAddr ?? "0.0.0.0:2377",
        ForceNewCluster: options.forceNewCluster,
        DefaultAddrPool: options.swarmDefaultAddrPool,
        SubnetSize: options.subnetSize,
        DataPathAddr: options.dataPathAddr,
        DataPathPort: options.dataPathPort,
      })
      logger.info("Swarm initialized successfully")
      return result
    } catch (error) {
      logger.error(`Failed to initialize swarm: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Join an existing swarm
   */
  async joinSwarm(options: SwarmJoinOptions): Promise<void> {
    logger.info("Joining swarm", { remoteAddrs: options.remoteAddrs })
    try {
      await this.docker.joinSwarm({
        RemoteAddrs: options.remoteAddrs,
        JoinToken: options.joinToken,
        ListenAddr: options.listenAddr ?? "0.0.0.0:2377",
        AdvertiseAddr: options.advertiseAddr,
        DataPathAddr: options.dataPathAddr,
      })
      logger.info("Joined swarm successfully")
    } catch (error) {
      logger.error(`Failed to join swarm: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Leave the swarm
   */
  async leaveSwarm(force: boolean = false): Promise<void> {
    logger.info("Leaving swarm", { force })
    try {
      await this.docker.leaveSwarm({ force })
      logger.info("Left swarm successfully")
    } catch (error) {
      logger.error(`Failed to leave swarm: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  // ============================================
  // Swarm Stack Operations
  // ============================================

  /**
   * Deploy a stack to swarm using docker stack deploy
   */
  async deployStack(options: SwarmStackDeployOptions): Promise<{ success: boolean; message: string }> {
    logger.info("Deploying swarm stack", { name: options.name })
    try {
      // Write compose file to temp location
      const composePath = `/tmp/stack-${options.name}-docker-compose.yaml`
      await Bun.write(composePath, options.composeFile)

      const args = [
        "stack",
        "deploy",
        "-c",
        composePath,
        options.name,
      ]

      if (options.withRegistryAuth) {
        args.push("--with-registry-auth")
      }
      if (options.prune) {
        args.push("--prune")
      }
      if (options.resolveImage) {
        args.push("--resolve-image", options.resolveImage)
      }
      if (options.detach !== false) {
        args.push("--detach")
      }

      const result = await this.runDockerCommand(args)

      // Cleanup temp file
      await Bun.$`rm -f ${composePath}`.quiet()

      if (result.success) {
        logger.info(`Stack ${options.name} deployed successfully`)
        return { success: true, message: result.output }
      } else {
        return { success: false, message: result.error ?? "Failed to deploy stack" }
      }
    } catch (error) {
      logger.error(`Failed to deploy stack: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Remove a stack from swarm
   */
  async removeStack(options: SwarmStackRemoveOptions): Promise<{ success: boolean; message: string }> {
    logger.info("Removing swarm stack", { name: options.name })
    try {
      const args = [
        "stack",
        "rm",
        options.name,
      ]

      if (options.prune) {
        args.push("--prune")
      }

      const result = await this.runDockerCommand(args)

      if (result.success) {
        logger.info(`Stack ${options.name} removed successfully`)
        return { success: true, message: result.output }
      } else {
        return { success: false, message: result.error ?? "Failed to remove stack" }
      }
    } catch (error) {
      logger.error(`Failed to remove stack: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * List stacks deployed in swarm
   */
  async listStacks(): Promise<SwarmStackInfo[]> {
    logger.info("Listing swarm stacks")
    try {
      const services = await this.docker.listServices()

      // Group services by stack name
      const stackMap = new Map<string, SwarmServiceInfo[]>()

      for (const service of services) {
        const labels = service.Spec?.Labels ?? {}
        const stackName = labels["com.docker.stack.namespace"] ?? ""

        if (stackName) {
          const serviceInfo = this.parseServiceInfo(service)
          if (!stackMap.has(stackName)) {
            stackMap.set(stackName, [])
          }
          stackMap.get(stackName)?.push(serviceInfo)
        }
      }

      // Build stack info
      const stacks: SwarmStackInfo[] = []
      for (const [name, services] of stackMap) {
        const networks = await this.getStackNetworks(name)
        stacks.push({
          name,
          services,
          networks,
          configs: [],
          secrets: [],
        })
      }

      return stacks
    } catch (error) {
      logger.error(`Failed to list stacks: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Get stack info by name
   */
  async getStack(name: string): Promise<SwarmStackInfo | null> {
    logger.info("Getting swarm stack", { name })
    try {
      const services = await this.docker.listServices({
        filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
      })

      if (services.length === 0) {
        return null
      }

      const serviceInfos = services.map((s) => this.parseServiceInfo(s))
      const networks = await this.getStackNetworks(name)

      return {
        name,
        services: serviceInfos,
        networks,
        configs: [],
        secrets: [],
      }
    } catch (error) {
      logger.error(`Failed to get stack: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  // ============================================
  // Swarm Service Operations
  // ============================================

  /**
   * List all swarm services
   */
  async listServices(): Promise<SwarmServiceInfo[]> {
    logger.info("Listing swarm services")
    try {
      const services = await this.docker.listServices()
      return services.map((s) => this.parseServiceInfo(s))
    } catch (error) {
      logger.error(`Failed to list services: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Get service by ID
   */
  async getService(serviceId: string): Promise<SwarmServiceInfo | null> {
    logger.info("Getting service", { serviceId })
    try {
      const service = this.docker.getService(serviceId)
      const inspect = await service.inspect()
      return this.parseServiceInfo(inspect)
    } catch {
      return null
    }
  }

  /**
   * Create a new swarm service
   */
  async createService(options: SwarmServiceCreateOptions): Promise<{ id: string; warnings?: string[] }> {
    logger.info("Creating service", { name: options.name })
    try {
      const serviceOptions: Docker.ServiceCreateOptions = {
        Name: options.name,
        TaskTemplate: {
          ContainerSpec: {
            Image: options.image,
            Env: options.env ? this.envMapToArray(options.env) : undefined,
            Labels: options.labels,
            Mounts: options.mounts?.map((m) => ({
              Type: m.type,
              Source: m.source,
              Target: m.target,
              ReadOnly: m.readOnly,
            })),
            HealthCheck: options.healthCheck
              ? {
                  Test: options.healthCheck.test,
                  Interval: options.healthCheck.interval
                    ? options.healthCheck.interval * 1000000
                    : undefined,
                  Timeout: options.healthCheck.timeout
                    ? options.healthCheck.timeout * 1000000
                    : undefined,
                  Retries: options.healthCheck.retries,
                  StartPeriod: options.healthCheck.startPeriod
                    ? options.healthCheck.startPeriod * 1000000
                    : undefined,
                }
              : undefined,
          },
          Placement: options.constraints
            ? { Constraints: options.constraints }
            : undefined,
          RestartPolicy: options.restartPolicy
            ? {
                Condition: options.restartPolicy.condition,
                Delay: options.restartPolicy.delay
                  ? options.restartPolicy.delay * 1000000000
                  : undefined,
                MaxAttempts: options.restartPolicy.maxAttempts,
                Window: options.restartPolicy.window
                  ? options.restartPolicy.window * 1000000000
                  : undefined,
              }
            : undefined,
          Resources: options.resources
            ? {
                Limits: options.resources.limits
                  ? {
                      NanoCPUs: options.resources.limits.nanoCpu,
                      MemoryBytes: options.resources.limits.memoryBytes,
                    }
                  : undefined,
                Reservations: options.resources.reservations
                  ? {
                      NanoCPUs: options.resources.reservations.nanoCpu,
                      MemoryBytes: options.resources.reservations.memoryBytes,
                    }
                  : undefined,
              }
            : undefined,
        },
        Mode: options.replicas !== undefined || !options.replicas
          ? { Replicated: { Replicas: options.replicas ?? 1 } }
          : undefined,
        Networks: options.networks?.map((n) => ({ Target: n })),
        EndpointSpec: options.ports
          ? {
              Ports: options.ports.map((p) => ({
                Protocol: p.protocol,
                TargetPort: p.targetPort,
                PublishedPort: p.publishedPort,
                PublishMode: p.mode === "host" ? "host" : "ingress",
              })),
            }
          : undefined,
        Labels: options.labels,
      }

      const result = await this.docker.createService(serviceOptions)
      logger.info(`Service ${options.name} created with ID: ${result.ID}`)
      return { id: result.ID, warnings: result.Warnings }
    } catch (error) {
      logger.error(`Failed to create service: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Update an existing service
   */
  async updateService(options: SwarmServiceUpdateOptions): Promise<{ success: boolean; message: string }> {
    logger.info("Updating service", { serviceId: options.serviceId })
    try {
      const service = this.docker.getService(options.serviceId)
      const current = await service.inspect()

      const updateOptions: Docker.ServiceUpdateOptions = {
        version: parseInt(current.Version?.Index?.toString() ?? "0", 10),
        Name: current.Spec?.Name,
        TaskTemplate: {
          ...current.Spec?.TaskTemplate,
          ContainerSpec: {
            ...current.Spec?.TaskTemplate?.ContainerSpec,
            Image: options.image ?? current.Spec?.TaskTemplate?.ContainerSpec?.Image,
            Env: options.env
              ? this.envMapToArray(options.env)
              : current.Spec?.TaskTemplate?.ContainerSpec?.Env,
            Labels: options.labels ?? current.Spec?.TaskTemplate?.ContainerSpec?.Labels,
          },
          Placement: options.constraints
            ? { Constraints: options.constraints }
            : current.Spec?.TaskTemplate?.Placement,
          RestartPolicy: options.restartPolicy
            ? {
                Condition: options.restartPolicy.condition,
                Delay: options.restartPolicy.delay
                  ? options.restartPolicy.delay * 1000000000
                  : undefined,
                MaxAttempts: options.restartPolicy.maxAttempts,
                Window: options.restartPolicy.window
                  ? options.restartPolicy.window * 1000000000
                  : undefined,
              }
            : current.Spec?.TaskTemplate?.RestartPolicy,
          Resources: options.resources
            ? {
                Limits: options.resources.limits
                  ? {
                      NanoCPUs: options.resources.limits.nanoCpu,
                      MemoryBytes: options.resources.limits.memoryBytes,
                    }
                  : undefined,
                Reservations: options.resources.reservations
                  ? {
                      NanoCPUs: options.resources.reservations.nanoCpu,
                      MemoryBytes: options.resources.reservations.memoryBytes,
                    }
                  : undefined,
              }
            : current.Spec?.TaskTemplate?.Resources,
        },
        Mode: options.replicas !== undefined
          ? { Replicated: { Replicas: options.replicas } }
          : current.Spec?.Mode,
      }

      await service.update(updateOptions)
      logger.info(`Service ${options.serviceId} updated successfully`)
      return { success: true, message: "Service updated successfully" }
    } catch (error) {
      logger.error(`Failed to update service: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Scale a service
   */
  async scaleService(serviceId: string, replicas: number): Promise<{ success: boolean; message: string }> {
    logger.info("Scaling service", { serviceId, replicas })
    return this.updateService({ serviceId, replicas })
  }

  /**
   * Remove a service
   */
  async removeService(serviceId: string): Promise<{ success: boolean }> {
    logger.info("Removing service", { serviceId })
    try {
      const service = this.docker.getService(serviceId)
      await service.remove()
      logger.info(`Service ${serviceId} removed successfully`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to remove service: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Get service logs (for streaming)
   */
  async getServiceLogs(
    options: SwarmLogsOptions,
    onLog: (log: StreamLogMessage) => void
  ): Promise<void> {
    logger.info("Getting service logs", { serviceId: options.serviceId, follow: options.follow })
    try {
      const service = this.docker.getService(options.serviceId)
      const logs = await service.logs({
        follow: options.follow ?? false,
        tail: options.tail ?? 100,
        since: options.since,
        timestamps: options.timestamps ?? true,
        details: options.details ?? false,
        stdout: true,
        stderr: true,
      })

      // Parse logs and call onLog callback
      const logString = logs.toString()
      const lines = logString.split("\n").filter((l) => l.trim())

      for (const line of lines) {
        onLog({
          timestamp: new Date().toISOString(),
          message: line,
          serviceId: options.serviceId,
          level: line.toLowerCase().includes("error") ? "error" : "info",
        })
      }
    } catch (error) {
      logger.error(`Failed to get service logs: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  // ============================================
  // Swarm Node Operations
  // ============================================

  /**
   * List all swarm nodes
   */
  async listNodes(): Promise<SwarmNodeInfo[]> {
    logger.info("Listing swarm nodes")
    try {
      const nodes = await this.docker.listNodes()
      return nodes.map((n) => this.parseNodeInfo(n))
    } catch (error) {
      logger.error(`Failed to list nodes: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Get node by ID
   */
  async getNode(nodeId: string): Promise<SwarmNodeInfo | null> {
    logger.info("Getting node", { nodeId })
    try {
      const node = this.docker.getNode(nodeId)
      const inspect = await node.inspect()
      return this.parseNodeInfo(inspect)
    } catch {
      return null
    }
  }

  /**
   * Update node availability
   */
  async updateNode(
    nodeId: string,
    options: { availability?: "active" | "pause" | "drain"; labels?: Record<string, string> }
  ): Promise<{ success: boolean }> {
    logger.info("Updating node", { nodeId, options })
    try {
      const node = this.docker.getNode(nodeId)
      const current = await node.inspect()

      const version = parseInt(current.Version?.Index?.toString() ?? "0", 10)
      const spec = {
        ...current.Spec,
        Availability: options.availability ?? current.Spec?.Availability,
        Labels: options.labels ?? current.Spec?.Labels,
      }

      await node.update({ version, ...spec })
      logger.info(`Node ${nodeId} updated successfully`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to update node: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Remove a node from swarm
   */
  async removeNode(nodeId: string, force: boolean = false): Promise<{ success: boolean }> {
    logger.info("Removing node", { nodeId, force })
    try {
      const node = this.docker.getNode(nodeId)
      await node.remove({ force })
      logger.info(`Node ${nodeId} removed successfully`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to remove node: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  // ============================================
  // Swarm Task Operations
  // ============================================

  /**
   * List swarm tasks
   */
  async listTasks(serviceId?: string): Promise<SwarmTaskInfo[]> {
    logger.info("Listing swarm tasks", { serviceId })
    try {
      const filters: Record<string, string[]> = {}
      if (serviceId) {
        filters.service = [serviceId]
      }

      const tasks = await this.docker.listTasks({
        filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
      })

      // Get node names for task info
      const nodes = await this.docker.listNodes()
      const nodeMap = new Map(nodes.map((n) => [n.ID, n.Description?.Hostname ?? n.ID]))

      return tasks.map((t) => this.parseTaskInfo(t, nodeMap))
    } catch (error) {
      logger.error(`Failed to list tasks: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  // ============================================
  // Swarm Network Operations
  // ============================================

  /**
   * List swarm networks
   */
  async listNetworks(): Promise<SwarmNetworkInfo[]> {
    logger.info("Listing swarm networks")
    try {
      const networks = await this.docker.listNetworks()
      return networks
        .filter((n) => n.Scope === "swarm")
        .map((n) => this.parseNetworkInfo(n))
    } catch (error) {
      logger.error(`Failed to list networks: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Create a swarm network
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
      const network = await this.docker.createNetwork({
        Name: options.name,
        Driver: options.driver ?? "overlay",
        Attachable: options.attachable ?? true,
        IPAM: options.subnet
          ? {
              Config: [{ Subnet: options.subnet }],
            }
          : undefined,
        Labels: options.labels,
      })
      logger.info(`Network ${options.name} created with ID: ${network.id}`)
      return { id: network.id }
    } catch (error) {
      logger.error(`Failed to create network: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  /**
   * Remove a network
   */
  async removeNetwork(networkId: string): Promise<{ success: boolean }> {
    logger.info("Removing network", { networkId })
    try {
      const network = this.docker.getNetwork(networkId)
      await network.remove()
      logger.info(`Network ${networkId} removed successfully`)
      return { success: true }
    } catch (error) {
      logger.error(`Failed to remove network: ${extractErrorMessage(error)}`)
      throw error
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Parse service info from Docker API response
   */
  private parseServiceInfo(service: Docker.ServiceInfo): SwarmServiceInfo {
    const spec = service.Spec
    const labels = spec?.Labels ?? {}
    const taskTemplate = spec?.TaskTemplate
    const containerSpec = taskTemplate?.ContainerSpec

    const mode = spec?.Mode?.Replicated
      ? "replicated"
      : spec?.Mode?.Global
        ? "global"
        : "replicated"

    const replicas = spec?.Mode?.Replicated?.Replicas ?? 1

    return {
      id: service.ID ?? "",
      name: spec?.Name ?? "",
      mode,
      replicas: {
        running: service.ServiceStatus?.RunningTasksCount ?? 0,
        desired: replicas,
        failed: service.ServiceStatus?.CompletedTasksCount ?? 0,
        pending: 0,
      },
      image: containerSpec?.Image ?? "",
      ports: (spec?.EndpointSpec?.Ports ?? []).map((p) => ({
        publishedPort: p.PublishedPort ?? 0,
        targetPort: p.TargetPort ?? 0,
        protocol: (p.Protocol as "tcp" | "udp" | "sctp") ?? "tcp",
        mode: (p.PublishMode as "ingress" | "host") ?? "ingress",
      })),
      createdAt: service.CreatedAt ?? "",
      updatedAt: service.UpdatedAt ?? "",
      labels,
      stackName: labels["com.docker.stack.namespace"] ?? "",
    }
  }

  /**
   * Parse node info from Docker API response
   */
  private parseNodeInfo(node: Docker.NodeInfo): SwarmNodeInfo {
    const spec = node.Spec
    const description = node.Description
    const status = node.Status
    const managerStatus = node.ManagerStatus

    return {
      id: node.ID ?? "",
      name: spec?.Name ?? node.ID ?? "",
      hostname: description?.Hostname ?? "",
      role: (spec?.Role as SwarmNodeRole) ?? "worker",
      availability: (spec?.Availability as SwarmNodeAvailability) ?? "active",
      state: (status?.State as SwarmNodeState) ?? "unknown",
      address: status?.Addr ?? "",
      labels: spec?.Labels ?? {},
      platform: {
        os: description?.Platform?.OS ?? "",
        architecture: description?.Platform?.Architecture ?? "",
      },
      resources: {
        nanoCpu: description?.Resources?.NanoCPUs ?? 0,
        memoryBytes: description?.Resources?.MemoryBytes ?? 0,
      },
      managerStatus: managerStatus
        ? {
            leader: managerStatus.Leader ?? false,
            reachability: managerStatus.Reachability ?? "",
            addr: managerStatus.Addr ?? "",
          }
        : undefined,
    }
  }

  /**
   * Parse task info from Docker API response
   */
  private parseTaskInfo(
    task: Docker.Task,
    nodeMap: Map<string, string>
  ): SwarmTaskInfo {
    const status = task.Status
    const nodeId = task.NodeID ?? ""

    return {
      id: task.ID ?? "",
      name: task.Name ?? `${task.ServiceID}.${task.Slot}`,
      serviceId: task.ServiceID ?? "",
      serviceName: task.ServiceName ?? "",
      nodeId,
      nodeName: nodeMap.get(nodeId) ?? nodeId,
      state: (status?.State as SwarmServiceState) ?? "pending",
      desiredState: (task.DesiredState as SwarmServiceState) ?? "pending",
      error: status?.Err,
      createdAt: task.CreatedAt ?? "",
      updatedAt: status?.Timestamp ?? "",
    }
  }

  /**
   * Parse network info from Docker API response
   */
  private parseNetworkInfo(network: Docker.NetworkInfo): SwarmNetworkInfo {
    return {
      id: network.Id ?? "",
      name: network.Name ?? "",
      driver: network.Driver ?? "",
      scope: (network.Scope as "local" | "swarm") ?? "local",
      attachable: network.Attachable ?? false,
      ingress: network.Ingress ?? false,
      ipam: {
        driver: network.IPAM?.Driver ?? "",
        config: (network.IPAM?.Config ?? []).map((c) => ({
          subnet: c.Subnet ?? "",
          gateway: c.Gateway,
        })),
      },
      labels: network.Labels ?? {},
    }
  }

  /**
   * Get networks for a specific stack
   */
  private async getStackNetworks(stackName: string): Promise<SwarmNetworkInfo[]> {
    const networks = await this.docker.listNetworks({
      filters: JSON.stringify({ label: [`com.docker.stack.namespace=${stackName}`] }),
    })
    return networks.map((n) => this.parseNetworkInfo(n))
  }

  /**
   * Convert env map to array format
   */
  private envMapToArray(env: EnvMap): string[] {
    return Object.entries(env)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${v}`)
  }

  /**
   * Run a docker command using Bun shell
   */
  private async runDockerCommand(
    args: string[]
  ): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const result = await Bun.$`docker ${args}`.quiet()
      return {
        success: result.exitCode === 0,
        output: result.stdout.toString(),
        error: result.exitCode !== 0 ? result.stderr.toString() : undefined,
      }
    } catch (error) {
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

export default new SwarmHandler()
