import { createLogger } from '@dockstat/logger'
import type DB from '@dockstat/sqlite-wrapper'
import type { DATABASE, DOCKER } from '@dockstat/typings'
import Dockerode, { type ContainerStats } from 'dockerode'
import { DockerEventEmitter } from './events/docker-events.js'
import HostHandler from './hosts-handler/index'
import MonitoringManager from './monitoring/monitoring-manager'
import { StreamManager } from './stream/stream-manager'

class DockerClient {
  private logger;
  private hostHandler: HostHandler
  private dockerInstances: Map<number, Dockerode> = new Map()
  private activeStreams: Map<string, NodeJS.Timeout> = new Map()
  private options: Required<
    Omit<DOCKER.DockerClientOptions, 'monitoringOptions'>
  > & {
    monitoringOptions?: DOCKER.DockerClientOptions['monitoringOptions']
  }
  public readonly events: DockerEventEmitter
  private monitoringManager?: MonitoringManager
  private streamManager?: StreamManager

  /**
   * Creates a new DockerClient instance.
   * @param DB - Database instance for host management.
   * @param options - Optional Docker client configuration.
   */
  constructor(id: number, DB: DB, options: DOCKER.DockerClientOptions = {}) {
    this.logger = createLogger(`DockerClient-${id}`)
    this.logger.info('Initializing DockerClient')
    this.logger.debug('Creating HostHandler instance')
    this.hostHandler = new HostHandler(id,DB)
    this.options = {
      defaultTimeout: options.defaultTimeout ?? 5000,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      enableMonitoring: options.enableMonitoring ?? true,
      enableEventEmitter: options.enableEventEmitter ?? true,
      monitoringOptions: options.monitoringOptions,
      execOptions: options.execOptions ?? {}
    }

    // Initialize event emitter
    this.events = new DockerEventEmitter()

    // Initialize monitoring manager if enabled
    if (this.options.enableMonitoring) {
      this.monitoringManager = new MonitoringManager(
        this.events,
        this.dockerInstances,
        this.hostHandler.getHosts(),
        this.options.monitoringOptions
      )
    }

    // Initialize stream manager
    this.streamManager = new StreamManager(this.events, this)
  }

  // Host Management
  /**
   * Adds a new Docker host to the client.
   * @param host - Host information to add.
   */
  public addHost(host: DATABASE.DB_target_host): void {
    this.logger.info(`Adding new host: ${host.name} (ID: ${host.id})`)
    this.hostHandler.addHost(host)
    const dockerInstance = new Dockerode({
      host: host.host,
      protocol: host.secure ? 'https' : 'http',
      port: host.secure ? 2376 : 2375,
      timeout: this.options.defaultTimeout,
    })
    this.dockerInstances.set(host.id, dockerInstance)

    // Update monitoring manager
    if (this.monitoringManager) {
      this.monitoringManager.updateHosts(this.hostHandler.getHosts())
      this.monitoringManager.updateDockerInstances(this.dockerInstances)
    }

    this.events.emitHostAdded(host.id, host.name)
  }

  /**
   * Removes a Docker host from the client.
   * @param host - Host information to remove.
   */
  public removeHost(host: DATABASE.DB_target_host): void {
    this.logger.info(`Removing host: ${host.name} (ID: ${host.id})`)
    this.hostHandler.removeHost(host)
    this.dockerInstances.delete(host.id)
    // Clean up any active streams for this host
    const streamsToRemove = Array.from(this.activeStreams.keys()).filter(
      (key) => key.includes(`host-${host.id}`)
    )
    for (const streamKey of streamsToRemove) {
      this.stopStream(streamKey)
    }

    // Update monitoring manager
    if (this.monitoringManager) {
      this.monitoringManager.updateHosts(this.hostHandler.getHosts())
      this.monitoringManager.updateDockerInstances(this.dockerInstances)
    }

    this.events.emitHostRemoved(host.id, host.name)
  }

  /**
   * Updates an existing Docker host with new information.
   * @param oldHost - The previous host information.
   * @param newHost - The new host information.
   */
  public updateHost(
    oldHost: DATABASE.DB_target_host,
    newHost: DATABASE.DB_target_host
  ): void {
    this.removeHost(oldHost)
    this.addHost(newHost)
    this.events.emitHostUpdated(newHost.id, newHost.name)
  }

  /**
   * Returns a list of all Docker hosts managed by the client.
   * @returns Array of host information.
   */
  public getHosts(): DATABASE.DB_target_host[] {
    return this.hostHandler.getHosts()
  }

  // Container Operations
  /**
   * Fetches all containers from all Docker hosts.
   * @returns Array of container information.
   */
  public async getAllContainers(): Promise<DOCKER.ContainerInfo[]> {
    this.logger.info('Fetching containers from all hosts')
    const allContainers: DOCKER.ContainerInfo[] = []
    const hosts = this.hostHandler.getHosts()
    this.logger.debug(`Found ${hosts.length} hosts to query`)

    await Promise.allSettled(
      hosts.map(async (host) => {
        try {
          const containers = await this.getContainersForHost(host.id)
          allContainers.push(...containers)
        } catch (error) {
          console.error(
            `Failed to get containers for host ${host.name}:`,
            error
          )
        }
      })
    )

    return allContainers
  }

  /**
   * Fetches all containers for a specific Docker host.
   * @param hostId - The ID of the host.
   * @returns Array of container information.
   */
  public async getContainersForHost(
    hostId: number
  ): Promise<DOCKER.ContainerInfo[]> {
    this.logger.debug(`Fetching containers for host ID: ${hostId}`)
    const docker = this.getDockerInstance(hostId)
    const containers = await this.withRetry(() =>
      docker.listContainers({ all: true })
    )

    return containers.map((container) =>
      this.mapContainerInfo(container, hostId)
    )
  }

  /**
   * Fetches detailed information for a specific container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @returns Container information object.
   */
  public async getContainer(
    hostId: number,
    containerId: string
  ): Promise<DOCKER.ContainerInfo> {
    this.logger.debug(`Fetching container ${containerId} from host ${hostId}`)
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    const containerInfo = await this.withRetry(() => container.inspect())

    return this.mapContainerInfoFromInspect(containerInfo, hostId)
  }

  // Container Statistics
  /**
   * Fetches statistics for all containers across all hosts.
   * @returns Array of container statistics information.
   */
  public async getAllContainerStats(): Promise<DOCKER.ContainerStatsInfo[]> {
    const allStats: DOCKER.ContainerStatsInfo[] = []
    const hosts = this.hostHandler.getHosts()

    await Promise.allSettled(
      hosts.map(async (host) => {
        try {
          const stats = await this.getContainerStatsForHost(host.id)
          allStats.push(...stats)
        } catch (error) {
          console.error(
            `Failed to get container stats for host ${host.name}:`,
            error
          )
        }
      })
    )

    return allStats
  }

  /**
   * Fetches statistics for all running containers on a specific host.
   * @param hostId - The ID of the host.
   * @returns Array of container statistics information.
   */
  public async getContainerStatsForHost(
    hostId: number
  ): Promise<DOCKER.ContainerStatsInfo[]> {
    const containers = await this.getContainersForHost(hostId)
    const runningContainers = containers.filter((c) => c.state === 'running')

    const statsPromises = runningContainers.map(async (container) => {
      try {
        const stats = await this.getContainerStats(hostId, container.id)
        return stats
      } catch (error) {
        console.error(
          `Failed to get stats for container ${container.name}:`,
          error
        )
        return null
      }
    })

    const results = await Promise.allSettled(statsPromises)
    return results
      .filter(
        (result): result is PromiseFulfilledResult<DOCKER.ContainerStatsInfo> =>
          result.status === 'fulfilled' && result.value !== null
      )
      .map((result) => result.value)
  }

  /**
   * Fetches statistics for a specific container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @returns Container statistics information.
   */
  public async getContainerStats(
    hostId: number,
    containerId: string
  ): Promise<DOCKER.ContainerStatsInfo> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    const [containerInfo, stats] = await Promise.all([
      this.withRetry(() => container.inspect()),
      this.withRetry(() => container.stats({ stream: false })),
    ])

    const mappedInfo = this.mapContainerInfoFromInspect(containerInfo, hostId)
    return this.mapContainerStats(mappedInfo, stats as ContainerStats)
  }

  // Host Metrics
  /**
   * Fetches metrics for all Docker hosts.
   * @returns Array of host metrics information.
   */
  public async getAllHostMetrics(): Promise<DOCKER.HostMetrics[]> {
    const hosts = this.hostHandler.getHosts()
    const metricsPromises = hosts.map(async (host) => {
      try {
        return await this.getHostMetrics(host.id)
      } catch (error) {
        console.error(`Failed to get metrics for host ${host.name}:`, error)
        return null
      }
    })

    const results = await Promise.allSettled(metricsPromises)
    return results
      .filter(
        (result): result is PromiseFulfilledResult<DOCKER.HostMetrics> =>
          result.status === 'fulfilled' && result.value !== null
      )
      .map((result) => result.value)
  }

  /**
   * Fetches all container and host statistics in a single response.
   * @returns Object containing containerStats, hostMetrics, and timestamp.
   */
  public async getAllStats(): Promise<DOCKER.AllStatsResponse> {
    const [containerStats, hostMetrics] = await Promise.all([
      this.getAllContainerStats(),
      this.getAllHostMetrics(),
    ])

    return {
      containerStats,
      hostMetrics,
      timestamp: Date.now(),
    }
  }

  /**
   * Fetches metrics for a specific Docker host.
   * @param hostId - The ID of the host.
   * @returns Host metrics information.
   */
  public async getHostMetrics(hostId: number): Promise<DOCKER.HostMetrics> {
    const docker = this.getDockerInstance(hostId)
    const host = this.hostHandler.getHosts().find((h) => h.id === hostId)

    if (!host) {
      throw new Error(`Host with ID ${hostId} not found`)
    }

    const [info, version] = await Promise.all([
      this.withRetry(() => docker.info()),
      this.withRetry(() => docker.version()),
    ])

    return {
      hostId,
      hostName: host.name,
      dockerVersion: version.Version,
      apiVersion: version.ApiVersion,
      os: info.OperatingSystem,
      architecture: info.Architecture,
      totalMemory: info.MemTotal,
      totalCPU: info.NCPU,
      kernelVersion: info.KernelVersion,
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      containersStopped: info.ContainersStopped,
      containersPaused: info.ContainersPaused,
      images: info.Images,
      systemTime: info.SystemTime,
    }
  }

  // Streaming
  /**
   * Starts a periodic stream of container statistics for a specific container.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @param callback - Callback to receive stream updates.
   * @param interval - Interval in milliseconds between updates.
   * @returns The stream key identifier.
   */
  public startContainerStatsStream(
    hostId: number,
    containerId: string,
    callback: DOCKER.StreamCallback,
    interval = 1000
  ): string {
    const streamKey = `container-stats-${hostId}-${containerId}`

    if (this.activeStreams.has(streamKey)) {
      this.stopStream(streamKey)
    }

    const timer = setInterval(async () => {
      try {
        const stats = await this.getContainerStats(hostId, containerId)
        callback({
          type: 'container_stats',
          hostId,
          timestamp: Date.now(),
          data: stats,
        })
      } catch (error) {
        callback({
          type: 'error',
          hostId,
          timestamp: Date.now(),
          data: {
            error: error instanceof Error ? new Error(error.message) : new Error('Unknown error'),
          },
        })
      }
    }, interval)

    this.activeStreams.set(streamKey, timer)
    return streamKey
  }

  /**
   * Starts a periodic stream of host metrics for a specific host.
   * @param hostId - The ID of the host.
   * @param callback - Callback to receive stream updates.
   * @param interval - Interval in milliseconds between updates.
   * @returns The stream key identifier.
   */
  public startHostMetricsStream(
    hostId: number,
    callback: DOCKER.StreamCallback,
    interval = 5000
  ): string {
    const streamKey = `host-metrics-${hostId}`

    if (this.activeStreams.has(streamKey)) {
      this.stopStream(streamKey)
    }

    const timer = setInterval(async () => {
      try {
        const metrics = await this.getHostMetrics(hostId)
        callback({
          type: 'host_metrics',
          hostId,
          timestamp: Date.now(),
          data: metrics,
        })
      } catch (error) {
        callback({
          type: 'error',
          hostId,
          timestamp: Date.now(),
          data: {
            error: error instanceof Error ? new Error(error.message) : new Error('Unknown error'),
          },
        })
      }
    }, interval)

    this.activeStreams.set(streamKey, timer)
    return streamKey
  }

  /**
   * Starts a periodic stream of all containers across all hosts.
   * @param callback - Callback to receive stream updates.
   * @param interval - Interval in milliseconds between updates.
   * @returns The stream key identifier.
   */
  public startAllContainersStream(
    callback: DOCKER.StreamCallback,
    interval = 2000
  ): string {
    const streamKey = 'all-containers'

    if (this.activeStreams.has(streamKey)) {
      this.stopStream(streamKey)
    }

    const timer = setInterval(async () => {
      try {
        const containers = await this.getAllContainers()
        callback({
          type: 'container_list',
          hostId: -1, // Special case for all hosts
          timestamp: Date.now(),
          data: containers,
        })
      } catch (error) {
        callback({
          type: 'error',
          hostId: -1,
          timestamp: Date.now(),
          data: {
            error: error instanceof Error ? new Error(error.message) : new Error('Unknown error'),
          },
        })
      }
    }, interval)

    this.activeStreams.set(streamKey, timer)
    return streamKey
  }

  /**
   * Starts a periodic stream of all statistics (containers and hosts).
   * @param callback - Callback to receive stream updates.
   * @param interval - Interval in milliseconds between updates.
   * @returns The stream key identifier.
   */
  public startAllStatsStream(
    callback: DOCKER.StreamCallback,
    interval = 5000
  ): string {
    const streamKey = 'all-stats'

    if (this.activeStreams.has(streamKey)) {
      this.stopStream(streamKey)
    }

    const timer = setInterval(async () => {
      try {
        const allStats = await this.getAllStats()
        callback({
          type: 'all_stats',
          hostId: -1, // Special case for all hosts
          timestamp: Date.now(),
          data: allStats,
        })
      } catch (error) {
        callback({
          type: 'error',
          hostId: -1,
          timestamp: Date.now(),
          data: {
            error: error instanceof Error ? new Error(error.message) : new Error('Unknown error'),
          },
        })
      }
    }, interval)

    this.activeStreams.set(streamKey, timer)
    return streamKey
  }

  /**
   * Stops a specific active stream by its key.
   * @param streamKey - The stream key identifier.
   * @returns True if the stream was stopped, false otherwise.
   */
  public stopStream(streamKey: string): boolean {
    const timer = this.activeStreams.get(streamKey)
    if (timer) {
      clearInterval(timer)
      this.activeStreams.delete(streamKey)
      return true
    }
    return false
  }

  /**
   * Stops all active streams managed by the client.
   */
  public stopAllStreams(): void {
    for (const timer of this.activeStreams.values()) {
      clearInterval(timer)
    }
    this.activeStreams.clear()
  }

  /**
   * Returns a list of all currently active stream keys.
   * @returns Array of stream key identifiers.
   */
  public getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys())
  }

  // Container Control Operations
  /**
   * Starts a specific container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   */
  public async startContainer(
    hostId: number,
    containerId: string
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.start())
  }

  /**
   * Stops a specific container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   */
  public async stopContainer(
    hostId: number,
    containerId: string
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.stop())
  }

  /**
   * Restarts a specific container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   */
  public async restartContainer(
    hostId: number,
    containerId: string
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.restart())
  }

  /**
   * Removes a specific container from a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @param force - Whether to force removal.
   */
  public async removeContainer(
    hostId: number,
    containerId: string,
    force = false
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.remove({ force }))
  }

  // Image Operations
  /**
   * Fetches a list of Docker images available on a host.
   * @param hostId - The ID of the host.
   * @returns Array of image information.
   */
  public async getImages(hostId: number): Promise<Dockerode.ImageInfo[]> {
    const docker = this.getDockerInstance(hostId)
    return await this.withRetry(() => docker.listImages())
  }

  /**
   * Pulls a Docker image onto a host.
   * @param hostId - The ID of the host.
   * @param imageName - The name of the image to pull.
   */
  public async pullImage(hostId: number, imageName: string): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const stream = await docker.pull(imageName)

    return new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err: unknown) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  // Network Operations
  /**
   * Fetches a list of Docker networks available on a host.
   * @param hostId - The ID of the host.
   * @returns Array of network information.
   */
  public async getNetworks(
    hostId: number
  ): Promise<Dockerode.NetworkInspectInfo[]> {
    const docker = this.getDockerInstance(hostId)
    return await this.withRetry(() => docker.listNetworks())
  }

  // Volume Operations
  /**
   * Fetches a list of Docker volumes available on a host.
   * @param hostId - The ID of the host.
   * @returns Array of volume information.
   */
  public async getVolumes(
    hostId: number
  ): Promise<Dockerode.VolumeInspectInfo[]> {
    const docker = this.getDockerInstance(hostId)
    const result = await this.withRetry(() => docker.listVolumes())
    return result.Volumes || []
  }

  // Health Check
  /**
   * Checks if a specific Docker host is healthy (reachable).
   * @param hostId - The ID of the host.
   * @returns True if healthy, false otherwise.
   */
  public async checkHostHealth(hostId: number): Promise<boolean> {
    try {
      const docker = this.getDockerInstance(hostId)
      console.debug(`Checking host health for host ID: ${hostId}`)

      await docker.ping()
      return true
    } catch {
      return false
    }
  }

  /**
   * Checks the health of all Docker hosts managed by the client.
   * @returns Object mapping host IDs to health status.
   */
  public async checkAllHostsHealth(): Promise<Record<number, boolean>> {
    const hosts = this.hostHandler.getHosts()
    const healthChecks = await Promise.allSettled(
      hosts.map(async (host) => ({
        hostId: host.id,
        healthy: await this.checkHostHealth(host.id),
      }))
    )

    const result = {} as Record<number, boolean>
    for (const check of healthChecks) {
      if (check.status === 'fulfilled') {
        result[check.value.hostId] = check.value.healthy
      }
    }

    return result
  }

  // Utility methods
  private getDockerInstance(hostId: number): Dockerode {
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      throw new Error(`No Docker instance found for host ID: ${hostId}`)
    }
    return docker
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    const lastError: Error = new Error('No attempts made')

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const _err = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.options.retryAttempts) {
          throw lastError
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.options.retryDelay)
        )
      }
    }

    throw lastError
  }

  private mapContainerInfo(
    container: Dockerode.ContainerInfo,
    hostId: number
  ): DOCKER.ContainerInfo {
    return {
      id: container.Id,
      hostId,
      name: container.Names[0]?.replace('/', '') || 'unknown',
      image: container.Image,
      status: container.Status,
      state: container.State,
      created: container.Created,
      ports: container.Ports.map((port) => ({
        privatePort: port.PrivatePort,
        publicPort: port.PublicPort,
        type: port.Type,
      })),
      labels: container.Labels || {},
      networkSettings: container.NetworkSettings ? { networks: {} } : undefined,
    }
  }

  private mapContainerInfoFromInspect(
    containerInfo: Dockerode.ContainerInspectInfo,
    hostId: number
  ): DOCKER.ContainerInfo {
    return {
      id: containerInfo.Id,
      hostId,
      name: containerInfo.Name.replace('/', ''),
      image: containerInfo.Config.Image,
      status: containerInfo.State.Status,
      state: containerInfo.State.Status,
      created: Math.floor(new Date(containerInfo.Created).getTime() / 1000),
      ports: Object.entries(containerInfo.NetworkSettings.Ports || {}).map(
        ([port, bindings]) => ({
          privatePort: Number.parseInt(port.split('/')[0]),
          publicPort: bindings?.[0]?.HostPort
            ? Number.parseInt(bindings[0].HostPort)
            : undefined,
          type: port.split('/')[1] || 'tcp',
        })
      ),
      labels: containerInfo.Config.Labels || {},
      networkSettings: {
        networks: containerInfo.NetworkSettings.Networks || {},
      },
    }
  }

  private mapContainerStats(
    containerInfo: DOCKER.ContainerInfo,
    stats: ContainerStats,
  ): DOCKER.ContainerStatsInfo {
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      (stats.precpu_stats?.cpu_usage?.total_usage || 0)
    const systemDelta =
      stats.cpu_stats.system_cpu_usage -
      (stats.precpu_stats?.system_cpu_usage || 0)
    const cpuUsage =
      systemDelta > 0
        ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100
        : 0

    const memoryUsage = stats.memory_stats.usage || 0
    const memoryLimit = stats.memory_stats.limit || 0

    let networkRx = 0
    let networkTx = 0

    if (stats.networks) {
      for (const network of Object.values(stats.networks)) {
        networkRx += network.rx_bytes || 0
        networkTx += network.tx_bytes || 0
      }
    }

    const blockRead =
      stats.blkio_stats?.io_service_bytes_recursive?.find(
        (stat) => stat.op === 'Read'
      )?.value || 0

    const blockWrite =
      stats.blkio_stats?.io_service_bytes_recursive?.find(
        (stat) => stat.op === 'Write'
      )?.value || 0

    return {
      ...containerInfo,
      stats,
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryUsage,
      memoryLimit,
      networkRx,
      networkTx,
      blockRead,
      blockWrite,
    }
  }

  // Monitoring Management
  /**
   * Starts the monitoring manager if enabled.
   * Emits a warning if the monitoring manager is not initialized.
   */
  public startMonitoring(): void {
    if (this.monitoringManager) {
      this.monitoringManager.startMonitoring()
    } else {
      this.events.emitWarning('Monitoring manager not initialized')
    }
  }

  /**
   * Stops the monitoring manager if enabled.
   */
  public stopMonitoring(): void {
    if (this.monitoringManager) {
      this.monitoringManager.stopMonitoring()
    }
  }

  /**
   * Checks if monitoring is currently active.
   * @returns True if monitoring is active, false otherwise.
   */
  public isMonitoring(): boolean {
    return this.monitoringManager?.getMonitoringState().isMonitoring ?? false
  }

  // Stream Management
  /**
   * Gets the stream manager instance.
   * @returns The StreamManager instance or undefined.
   */
  public getStreamManager(): StreamManager | undefined {
    return this.streamManager
  }

  /**
   * Creates a new stream connection.
   * @param connectionId - The connection identifier.
   */
  public createStreamConnection(connectionId: string): void {
    if (this.streamManager) {
      this.streamManager.createConnection(connectionId)
    }
  }

  /**
   * Closes an existing stream connection.
   * @param connectionId - The connection identifier.
   */
  public closeStreamConnection(connectionId: string): void {
    if (this.streamManager) {
      this.streamManager.closeConnection(connectionId)
    }
  }

  /**
   * Handles a message for a specific stream connection.
   * @param connectionId - The connection identifier.
   * @param message - The message to handle.
   */
  public handleStreamMessage(connectionId: string, message: string): void {
    if (this.streamManager) {
      this.streamManager.handleMessage(connectionId, message)
    }
  }

  // Advanced Container Operations
  /**
   * Pauses a running container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   */
  public async pauseContainer(
    hostId: number,
    containerId: string
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.pause())
  }

  /**
   * Unpauses a paused container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   */
  public async unpauseContainer(
    hostId: number,
    containerId: string
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.unpause())
  }

  /**
   * Sends a kill signal to a container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @param signal - The signal to send (default: 'SIGKILL').
   */
  public async killContainer(
    hostId: number,
    containerId: string,
    signal = 'SIGKILL'
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.kill({ signal }))
  }

  /**
   * Renames a container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @param newName - The new name for the container.
   */
  public async renameContainer(
    hostId: number,
    containerId: string,
    newName: string
  ): Promise<void> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)
    await this.withRetry(() => container.rename({ name: newName }))
  }

  /**
   * Fetches logs for a specific container on a host.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @param options - Log options (stdout, stderr, timestamps, tail, since).
   * @returns The container logs as a string.
   */
  public async getContainerLogs(
    hostId: number,
    containerId: string,
    options: {
      stdout?: boolean
      stderr?: boolean
      timestamps?: boolean
      tail?: number
      since?: string
      until?: string
    } = {}
  ): Promise<string> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    const logOptions = {
      stdout: options.stdout ?? true,
      stderr: options.stderr ?? true,
      timestamps: options.timestamps ?? false,
      tail: options.tail ?? 100,
      ...options,
    }

    const logStream = await this.withRetry(() => container.logs(logOptions))
    return logStream.toString()
  }

  /**
   * Executes a command inside a running container.
   * @param hostId - The ID of the host.
   * @param containerId - The ID of the container.
   * @param command - Array of command arguments to execute.
   * @param options - Execution options (attachStdout, attachStderr, tty, env, workingDir).
   * @returns An object containing stdout, stderr, and exitCode.
   */
  public async execInContainer(
    hostId: number,
    containerId: string,
    command: string[],
    options: {
      attachStdout?: boolean
      attachStderr?: boolean
      tty?: boolean
      env?: string[]
      workingDir?: string
    } = {}
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    const execOptions = {
      Cmd: command,
      AttachStdout: options.attachStdout ?? true,
      AttachStderr: options.attachStderr ?? true,
      Tty: options.tty ?? false,
      Env: options.env,
      WorkingDir: options.workingDir,
    }

    try {
      const exec = await this.withRetry(() => container.exec(execOptions))

      // Start the exec without hijacking to avoid malformed HTTP responses
      const stream = await this.withRetry(() =>
        exec.start({
          Detach: false,
          Tty: options.tty ?? false,
        })
      )

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []

        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })

        stream.on('end', async () => {
          try {
            // Combine all chunks
            const combinedBuffer = Buffer.concat(chunks)

            let stdout = ''
            let stderr = ''

            if (options.tty) {
              // TTY mode: no stream multiplexing, everything goes to stdout
              stdout = combinedBuffer.toString()
            } else {
              // Parse Docker's stream format
              let offset = 0
              while (offset < combinedBuffer.length) {
                if (offset + 8 > combinedBuffer.length) break

                const streamType = combinedBuffer.readUInt8(offset)
                const frameSize = combinedBuffer.readUInt32BE(offset + 4)

                if (offset + 8 + frameSize > combinedBuffer.length) break

                const frameData = combinedBuffer.subarray(
                  offset + 8,
                  offset + 8 + frameSize
                )

                if (streamType === 1) {
                  stdout += frameData.toString()
                } else if (streamType === 2) {
                  stderr += frameData.toString()
                }

                offset += 8 + frameSize
              }
            }

            // Get the exit code
            const inspectResult = await exec.inspect()
            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: inspectResult.ExitCode ?? 0,
            })
          } catch (error) {
            reject(error)
          }
        })

        stream.on('error', reject)

        // Set a timeout to prevent hanging
        setTimeout(() => {
          reject(new Error('Exec operation timed out'))
        }, 30000) // 30 second timeout
      })
    } catch (error) {
      throw new Error(`Failed to execute command in container: ${error}`)
    }
  }

  // System Operations
  /**
   * Retrieves system information for a Docker host.
   * @param hostId - The ID of the host.
   * @returns System information object.
   */
  public async getSystemInfo(hostId: number): Promise<DOCKER.DockerAPIResponse['systemInfo']> {
    const docker = this.getDockerInstance(hostId)
    return await this.withRetry(() => docker.info())
  }

  /**
   * Retrieves Docker version information for a host.
   * @param hostId - The ID of the host.
   * @returns Docker version information object.
   */
  public async getSystemVersion(hostId: number) {
    const docker = this.getDockerInstance(hostId)
    return await this.withRetry(() => docker.version())
  }

  /**
   * Retrieves disk usage information for a Docker host.
   * @param hostId - The ID of the host.
   * @returns Disk usage information object.
   */
  public async getDiskUsage(hostId: number): Promise<DOCKER.DockerAPIResponse['diskUsage']> {
    const docker = this.getDockerInstance(hostId)
    return await this.withRetry(() => docker.df())
  }

  /**
   * Prunes unused Docker images on a host.
   * @param hostId - The ID of the host.
   * @returns Object containing the amount of space reclaimed.
   */
  public async pruneSystem(hostId: number): Promise<{ SpaceReclaimed: number }> {
    const docker = this.getDockerInstance(hostId)
    return await this.withRetry(() => docker.pruneImages({ dangling: false }))
  }

  // Resource cleanup
  public async cleanup(): Promise<void> {
    this.stopMonitoring()
    this.stopAllStreams()

    if (this.streamManager) {
      this.streamManager.cleanup()
    }

    // Clear all instances
    this.dockerInstances.clear()
  }
}

export default DockerClient
