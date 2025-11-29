import type { DATABASE, DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import Logger from "@dockstat/logger"
import { HealthCheckMonitor } from "./monitors/HealthCheckMonitor"
import { ContainerEventMonitor } from "./monitors/ContainerEventMonitor"
import { HostMetricsMonitor } from "./monitors/HostMetricsMonitor"
import { DockerEventStreamManager } from "./monitors/DockerEventStreamManager"

export default class MonitoringManager {
	private logger: Logger
	private options: Required<DOCKER.MonitoringOptions>
	private isMonitoring = false

	private healthCheckMonitor: HealthCheckMonitor
	private containerEventMonitor: ContainerEventMonitor
	private hostMetricsMonitor: HostMetricsMonitor
	private dockerEventStreamManager: DockerEventStreamManager
	private dockerInstances: Map<number, Dockerode>
	private hosts: DATABASE.DB_target_host[]

	constructor(
		loggerParents: string[],
		dockerInstances: Map<number, Dockerode>,
		hosts: DATABASE.DB_target_host[],
		options: DOCKER.MonitoringOptions = {}
	) {
		this.dockerInstances = dockerInstances
		this.hosts = hosts
		this.logger = new Logger("MM", loggerParents)

		this.options = {
			healthCheckInterval: options.healthCheckInterval ?? 30000,
			containerEventPollingInterval:
				options.containerEventPollingInterval ?? 5000,
			hostMetricsInterval: options.hostMetricsInterval ?? 10000,
			containerMetricsInterval: options.containerMetricsInterval ?? 10000,
			enableContainerMetrics: options.enableContainerMetrics ?? true,
			enableContainerEvents: options.enableContainerEvents ?? true,
			enableHostMetrics: options.enableHostMetrics ?? true,
			enableHealthChecks: options.enableHealthChecks ?? true,
			retryAttempts: options.retryAttempts ?? 3,
			retryDelay: options.retryDelay ?? 1000,
		}

		const retryOpts = {
			retryAttempts: this.options.retryAttempts,
			retryDelay: this.options.retryDelay,
		}

		const parents = this.logger.getParentsForLoggerChaining()

		this.healthCheckMonitor = new HealthCheckMonitor(
			parents,
			this.dockerInstances,
			this.hosts,
			{
				interval: this.options.healthCheckInterval,
				...retryOpts,
			}
		)

		this.containerEventMonitor = new ContainerEventMonitor(
			parents,
			this.dockerInstances,
			this.hosts,
			{
				interval: this.options.containerEventPollingInterval,
				...retryOpts,
			}
		)

		this.hostMetricsMonitor = new HostMetricsMonitor(
			parents,
			this.dockerInstances,
			this.hosts,
			{
				interval: this.options.hostMetricsInterval,
				...retryOpts,
			}
		)

		this.dockerEventStreamManager = new DockerEventStreamManager(
			parents,
			this.dockerInstances,
			this.hosts,
			retryOpts
		)

		this.logger.info("Initialized MonitoringManager")
	}

	public startMonitoring(): void {
		if (this.isMonitoring) {
			this.logger.info("Monitoring is already running")
			return
		}

		this.isMonitoring = true
		this.logger.info("Starting monitoring services")

		if (this.options.enableHealthChecks) {
			this.logger.debug("Starting Health Check monitor")
			this.healthCheckMonitor.start()
		}
		if (this.options.enableContainerEvents) {
			this.logger.debug("Starting Container Events monitor")
			this.containerEventMonitor.start()
		}
		if (this.options.enableHostMetrics) {
			this.logger.debug("Starting Host Metrics Monitor")
			this.hostMetricsMonitor.start()
		}

		this.dockerEventStreamManager.start()
	}

	public stopMonitoring(): void {
		if (!this.isMonitoring) {
			this.logger.warn("Monitoring is not running")
			return
		}

		this.isMonitoring = false
		this.logger.info("Stopping monitoring services")

		this.healthCheckMonitor.stop()
		this.containerEventMonitor.stop()
		this.hostMetricsMonitor.stop()
		this.dockerEventStreamManager.stop()
	}

	public updateHosts(hosts: DATABASE.DB_target_host[]): void {
		this.hosts = hosts
		this.healthCheckMonitor.updateHosts(hosts)
		this.containerEventMonitor.updateHosts(hosts)
		this.hostMetricsMonitor.updateHosts(hosts)
		this.dockerEventStreamManager.updateHosts(hosts)

		if (this.isMonitoring) {
			this.dockerEventStreamManager.restart()
		}
	}

	public updateDockerInstances(instances: Map<number, Dockerode>): void {
		this.dockerInstances = instances
		this.healthCheckMonitor.updateDockerInstances(instances)
		this.containerEventMonitor.updateDockerInstances(instances)
		this.hostMetricsMonitor.updateDockerInstances(instances)
		this.dockerEventStreamManager.updateDockerInstances(instances)

		if (this.isMonitoring) {
			this.dockerEventStreamManager.restart()
		}
	}

	public getMonitoringState(): {
		isMonitoring: boolean
		lastHealthStatus: Map<number, boolean>
		lastContainerStates: Map<string, DOCKER.ContainerInfo[]>
		dockerEventStreams: Map<number, NodeJS.ReadableStream>
	} {
		return {
			isMonitoring: this.isMonitoring,
			lastHealthStatus: this.healthCheckMonitor.getLastHealthStatus(),
			lastContainerStates: this.containerEventMonitor.getLastContainerStates(),
			dockerEventStreams: this.dockerEventStreamManager.getStreams(),
		}
	}
}
