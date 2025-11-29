import type { DATABASE, DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import Logger from "@dockstat/logger"
import { proxyEvent } from "../../events/workerEventProxy"
import { withRetry } from "../utils/retry"

export class HostMetricsMonitor {
	private intervalId?: ReturnType<typeof setInterval>
	private logger: Logger

	constructor(
		loggerParents: string[],
		private dockerInstances: Map<number, Dockerode>,
		private hosts: DATABASE.DB_target_host[],
		private options: {
			interval: number
			retryAttempts: number
			retryDelay: number
		}
	) {
		this.logger = new Logger("HMM", loggerParents)
	}

	start(): void {
		this.logger.info(
			`Starting host metrics monitoring at interval ${this.options.interval}ms`
		)
		this.intervalId = setInterval(
			() => this.collectMetrics(),
			this.options.interval
		)
		this.collectMetrics().catch((error) => {
			this.logger.error(`Initial Host monitoring failed! - ${error}`)
			proxyEvent("error", error, { message: "Initial Host monitoring failed!" })
		})
	}

	stop(): void {
		if (this.intervalId) {
			this.logger.info("Stopping Host Metrics Monitoring")
			clearInterval(this.intervalId)
			this.intervalId = undefined
		}
	}

	updateHosts(hosts: DATABASE.DB_target_host[]): void {
		this.hosts = hosts
	}

	updateDockerInstances(instances: Map<number, Dockerode>): void {
		this.dockerInstances = instances
	}

	private async collectMetrics(): Promise<void> {
		this.logger.debug("Collecting Host Metrics")
		const promises = this.hosts.map(async (host) => {
			try {
				const metrics = await this.getHostMetrics(host.id)
				proxyEvent("host:metrics", {
					hostId: host.id,
					docker_client_id: host.docker_client_id,
					metrics,
					hostName: host.name,
				})
			} catch (error) {
				proxyEvent(
					"error",
					error instanceof Error ? error : new Error(String(error)),
					{ hostId: host.id, message: "Collecting Host metrics failed" }
				)
			}
		})
		await Promise.allSettled(promises)
	}

	private async getHostMetrics(hostId: number): Promise<DOCKER.HostMetrics> {
		this.logger.debug(
			`Collecting Host Metrics for ${JSON.stringify({ hostId })}`
		)
		const docker = this.dockerInstances.get(hostId)
		const host = this.hosts.find((h) => h.id === hostId)

		if (!docker || !host) {
			this.logger.error(`Docker instance or host not found for ID ${hostId}`)
			throw new Error(`Docker instance or host not found for ID ${hostId}`)
		}

		const [info, version] = await Promise.all([
			withRetry<DOCKER.DockerAPIResponse["systemInfo"]>(
				() => docker.info(),
				this.options.retryAttempts,
				this.options.retryDelay
			),
			withRetry<DOCKER.DockerAPIResponse["dockerVersion"]>(
				() => docker.version(),
				this.options.retryAttempts,
				this.options.retryDelay
			),
		])

		this.logger.debug(
			`Collected Host Metrics for ${JSON.stringify({ hostId })}`
		)

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
}
