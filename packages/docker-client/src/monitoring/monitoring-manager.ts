import type { DATABASE } from '@dockstat/typings'
import type { DOCKER } from '@dockstat/typings'
import type Dockerode from 'dockerode'
import type { DockerEventEmitter } from '../events/docker-events'

export default class MonitoringManager {
  private eventEmitter: DockerEventEmitter
  private dockerInstances: Map<number, Dockerode>
  private hosts: DATABASE.DB_target_host[]
  private options: Required<DOCKER.MonitoringOptions>
  private state: DOCKER.MonitoringState

  constructor(
    eventEmitter: DockerEventEmitter,
    dockerInstances: Map<number, Dockerode>,
    hosts: DATABASE.DB_target_host[],
    options: DOCKER.MonitoringOptions = {}
  ) {
    this.eventEmitter = eventEmitter
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.options = {
      healthCheckInterval: options.healthCheckInterval ?? 30000,
      containerEventPollingInterval:
        options.containerEventPollingInterval ?? 5000,
      hostMetricsInterval: options.hostMetricsInterval ?? 10000,
      enableContainerEvents: options.enableContainerEvents ?? true,
      enableHostMetrics: options.enableHostMetrics ?? true,
      enableHealthChecks: options.enableHealthChecks ?? true,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
    }

    this.state = {
      isMonitoring: false,
      lastHealthStatus: new Map(),
      lastContainerStates: new Map(),
      dockerEventStreams: new Map(),
    }
  }

  public startMonitoring(): void {
    if (this.state.isMonitoring) {
      this.eventEmitter.emitWarning('Monitoring is already running')
      return
    }

    this.state.isMonitoring = true
    this.eventEmitter.emitInfo('Starting monitoring services')

    if (this.options.enableHealthChecks) {
      this.startHealthChecks()
    }

    if (this.options.enableContainerEvents) {
      this.startContainerEventMonitoring()
    }

    if (this.options.enableHostMetrics) {
      this.startHostMetricsMonitoring()
    }

    // Start Docker event streams for real-time container events
    this.startDockerEventStreams()
  }

  public stopMonitoring(): void {
    if (!this.state.isMonitoring) {
      this.eventEmitter.emitWarning('Monitoring is not running')
      return
    }

    this.state.isMonitoring = false
    this.eventEmitter.emitInfo('Stopping monitoring services')

    // Clear intervals
    if (this.state.healthCheckInterval) {
      clearInterval(this.state.healthCheckInterval)
      this.state.healthCheckInterval = undefined
    }

    if (this.state.containerEventInterval) {
      clearInterval(this.state.containerEventInterval)
      this.state.containerEventInterval = undefined
    }

    if (this.state.hostMetricsInterval) {
      clearInterval(this.state.hostMetricsInterval)
      this.state.hostMetricsInterval = undefined
    }

    // Stop Docker event streams
    this.stopDockerEventStreams()
  }

  public updateHosts(hosts: DATABASE.DB_target_host[]): void {
    this.hosts = hosts

    if (this.state.isMonitoring) {
      // Restart Docker event streams with new hosts
      this.stopDockerEventStreams()
      this.startDockerEventStreams()
    }
  }

  public updateDockerInstances(dockerInstances: Map<number, Dockerode>): void {
    this.dockerInstances = dockerInstances

    if (this.state.isMonitoring) {
      // Restart Docker event streams with new instances
      this.stopDockerEventStreams()
      this.startDockerEventStreams()
    }
  }

  public getMonitoringState(): Readonly<DOCKER.MonitoringState> {
    return { ...this.state }
  }

  private startHealthChecks(): void {
    this.state.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks()
    }, this.options.healthCheckInterval)

    // Initial health check
    this.performHealthChecks().catch((error) => {
      this.eventEmitter.emitError(error, { context: 'initial_health_check' })
    })
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = this.hosts.map(async (host) => {
      try {
        const docker = this.dockerInstances.get(host.id)
        if (!docker) {
          throw new Error(`No Docker instance found for host ${host.id}`)
        }

        await this.withRetry(() => docker.ping())

        const wasHealthy = this.state.lastHealthStatus.get(host.id)
        if (wasHealthy !== true) {
          this.state.lastHealthStatus.set(host.id, true)
          this.eventEmitter.emitHostHealthChanged(host.id, true)
        }
      } catch (error) {
        const wasHealthy = this.state.lastHealthStatus.get(host.id)
        if (wasHealthy !== false) {
          this.state.lastHealthStatus.set(host.id, false)
          this.eventEmitter.emitHostHealthChanged(host.id, false)
        }

        this.eventEmitter.emitError(
          error instanceof Error ? error : new Error(String(error)),
          { context: 'health_check', hostId: host.id, hostName: host.name }
        )
      }
    })

    await Promise.allSettled(healthPromises)
  }

  private startContainerEventMonitoring(): void {
    this.state.containerEventInterval = setInterval(async () => {
      await this.monitorContainerChanges()
    }, this.options.containerEventPollingInterval)

    // Initial container state capture
    this.captureInitialContainerStates().catch((error) => {
      this.eventEmitter.emitError(error, {
        context: 'initial_container_state',
      })
    })
  }

  private async captureInitialContainerStates(): Promise<void> {
    const statePromises = this.hosts.map(async (host) => {
      try {
        const containers = await this.getContainersForHost(host.id)
        this.state.lastContainerStates.set(`host-${host.id}`, containers)
      } catch (error) {
        this.eventEmitter.emitError(
          error instanceof Error ? error : new Error(String(error)),
          { context: 'capture_container_state', hostId: host.id }
        )
      }
    })

    await Promise.allSettled(statePromises)
  }

  private async monitorContainerChanges(): Promise<void> {
    const changePromises = this.hosts.map(async (host) => {
      try {
        const currentContainers = await this.getContainersForHost(host.id)
        const lastContainers =
          this.state.lastContainerStates.get(`host-${host.id}`) || []

        this.detectContainerChanges(host.id, lastContainers, currentContainers)
        this.state.lastContainerStates.set(`host-${host.id}`, currentContainers)
      } catch (error) {
        this.eventEmitter.emitError(
          error instanceof Error ? error : new Error(String(error)),
          { context: 'monitor_container_changes', hostId: host.id }
        )
      }
    })

    await Promise.allSettled(changePromises)
  }

  private detectContainerChanges(
    hostId: number,
    lastContainers: DOCKER.ContainerInfo[],
    currentContainers: DOCKER.ContainerInfo[]
  ): void {
    const lastContainerMap = new Map(lastContainers.map((c) => [c.id, c]))
    const currentContainerMap = new Map(currentContainers.map((c) => [c.id, c]))

    // Detect new containers
    for (const container of currentContainers) {
      if (!lastContainerMap.has(container.id)) {
        this.eventEmitter.emitContainerCreated(hostId, container.id, container)
      } else {
        // Detect state changes
        const lastContainer = lastContainerMap.get(container.id)
        if (lastContainer && lastContainer.state !== container.state) {
          if (
            container.state === 'running' &&
            lastContainer.state !== 'running'
          ) {
            this.eventEmitter.emitContainerStarted(
              hostId,
              container.id,
              container
            )
          } else if (
            container.state !== 'running' &&
            lastContainer.state === 'running'
          ) {
            this.eventEmitter.emitContainerStopped(
              hostId,
              container.id,
              container
            )
          }
        }
      }
    }

    // Detect removed containers
    for (const lastContainer of lastContainers) {
      if (!currentContainerMap.has(lastContainer.id)) {
        this.eventEmitter.emitContainerRemoved(hostId, lastContainer.id)
      }
    }
  }

  private startHostMetricsMonitoring(): void {
    this.state.hostMetricsInterval = setInterval(async () => {
      await this.collectHostMetrics()
    }, this.options.hostMetricsInterval)

    // Initial metrics collection
    this.collectHostMetrics().catch((error) => {
      this.eventEmitter.emitError(error, { context: 'initial_host_metrics' })
    })
  }

  private async collectHostMetrics(): Promise<void> {
    const metricsPromises = this.hosts.map(async (host) => {
      try {
        const metrics = await this.getHostMetrics(host.id)
        this.eventEmitter.emitHostMetrics(host.id, metrics)
      } catch (error) {
        this.eventEmitter.emitError(
          error instanceof Error ? error : new Error(String(error)),
          { context: 'collect_host_metrics', hostId: host.id }
        )
      }
    })

    await Promise.allSettled(metricsPromises)
  }

  private startDockerEventStreams(): void {
    for (const host of this.hosts) {
      try {
        const docker = this.dockerInstances.get(host.id)
        if (!docker) {
          throw new Error(`No Docker instance found for host ${host.id}`)
        }

        const eventStreamPromise = docker.getEvents({
          filters: {
            type: ['container'],
            event: ['start', 'stop', 'die', 'create', 'destroy'],
          },
        })

        eventStreamPromise
          .then((eventStream) => {
            eventStream.on('data', (chunk: Buffer) => {
              try {
                const event = JSON.parse(chunk.toString())
                this.handleDockerEvent(host.id, event)
              } catch (error) {
                this.eventEmitter.emitError(
                  error instanceof Error ? error : new Error(String(error)),
                  { context: 'parse_docker_event', hostId: host.id }
                )
              }
            })

            eventStream.on('error', (error: Error) => {
              this.eventEmitter.emitError(error, {
                context: 'docker_event_stream',
                hostId: host.id,
              })
            })

            this.state.dockerEventStreams.set(host.id, eventStream)
          })
          .catch((error) => {
            this.eventEmitter.emitError(
              error instanceof Error ? error : new Error(String(error)),
              { context: 'start_docker_event_stream', hostId: host.id }
            )
          })
      } catch (error) {
        this.eventEmitter.emitError(
          error instanceof Error ? error : new Error(String(error)),
          { context: 'start_docker_event_stream', hostId: host.id }
        )
      }
    }
  }

  private stopDockerEventStreams(): void {
    this.state.dockerEventStreams.forEach((stream, hostId) => {
      try {
        if ('destroy' in stream && typeof stream.destroy === 'function') {
          stream.destroy()
        }
      } catch (error) {
        this.eventEmitter.emitError(
          error instanceof Error ? error : new Error(String(error)),
          { context: 'stop_docker_event_stream', hostId }
        )
      }
    })
    this.state.dockerEventStreams.clear()
  }

  private handleDockerEvent(hostId: number, event: any): void {
    const containerId = event.Actor?.ID
    if (!containerId) {
      return
    }

    switch (event.Action) {
      case 'start':
        // We'll get the container info and emit the event
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            this.eventEmitter.emitContainerStarted(
              hostId,
              containerId,
              containerInfo
            )
          })
          .catch((error) => {
            this.eventEmitter.emitError(error, {
              context: 'handle_container_start_event',
              hostId,
              containerId,
            })
          })
        break

      case 'stop':
      case 'die':
        this.eventEmitter.emitContainerDied(hostId, containerId)
        break

      case 'create':
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            this.eventEmitter.emitContainerCreated(
              hostId,
              containerId,
              containerInfo
            )
          })
          .catch((error) => {
            this.eventEmitter.emitError(error, {
              context: 'handle_container_create_event',
              hostId,
              containerId,
            })
          })
        break

      case 'destroy':
        this.eventEmitter.emitContainerRemoved(hostId, containerId)
        break
    }
  }

  private async getContainerInfo(
    hostId: number,
    containerId: string
  ): Promise<DOCKER.ContainerInfo> {
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      throw new Error(`No Docker instance found for host ${hostId}`)
    }

    const container = docker.getContainer(containerId)
    const containerInfo = await this.withRetry(() => container.inspect())

    return this.mapContainerInfoFromInspect(containerInfo, hostId)
  }

  private async getContainersForHost(
    hostId: number
  ): Promise<DOCKER.ContainerInfo[]> {
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      throw new Error(`No Docker instance found for host ${hostId}`)
    }

    const containers = await this.withRetry(() =>
      docker.listContainers({ all: true })
    )
    return containers.map((container) =>
      this.mapContainerInfo(container, hostId)
    )
  }

  private async getHostMetrics(hostId: number): Promise<DOCKER.HostMetrics> {
    const docker = this.dockerInstances.get(hostId)
    const host = this.hosts.find((h) => h.id === hostId)

    if (!docker || !host) {
      throw new Error(`Docker instance or host not found for ID ${hostId}`)
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

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        if (attempt === this.options.retryAttempts) {
          throw err
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.options.retryDelay)
        )
      }
    }
    throw new Error('Unexpected retry logic failure')
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
      networkSettings: container.NetworkSettings
        ? {
            networks: container.NetworkSettings.Networks || {},
          }
        : undefined,
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
}
