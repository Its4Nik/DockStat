import type { DATABASE } from "@dockstat/typings"
import type Dockerode from "dockerode"
import Logger from "@dockstat/logger"
import { proxyEvent } from "../../events/workerEventProxy"
import { withRetry } from "../utils/retry"

const logger = new Logger("HealthCheckMonitor")

export class HealthCheckMonitor {
	private intervalId?: ReturnType<typeof setInterval>
	private lastHealthStatus = new Map<number, boolean>()

	constructor(
		private dockerInstances: Map<number, Dockerode>,
		private hosts: DATABASE.DB_target_host[],
		private options: {
			interval: number
			retryAttempts: number
			retryDelay: number
		}
	) {}

	start(): void {
		logger.debug(
			`Starting health checks at interval ${this.options.interval}ms`
		)
		this.intervalId = setInterval(
			() => this.performChecks(),
			this.options.interval
		)
		this.performChecks().catch((error) => {
			proxyEvent("error", {
				message: error.message || String(error),
				name: "",
				stack: error.stack,
			})
		})
	}

	stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = undefined
		}
	}

	getLastHealthStatus(): Map<number, boolean> {
		return new Map(this.lastHealthStatus)
	}

	updateHosts(hosts: DATABASE.DB_target_host[]): void {
		this.hosts = hosts
	}

	updateDockerInstances(instances: Map<number, Dockerode>): void {
		this.dockerInstances = instances
	}

	private async performChecks(): Promise<void> {
		const promises = this.hosts.map((host) => this.checkHost(host))
		await Promise.allSettled(promises)
	}

	private async checkHost(host: DATABASE.DB_target_host): Promise<void> {
		try {
			const docker = this.dockerInstances.get(host.id)
			if (!docker) {
				throw new Error(`No Docker instance found for host ${host.id}`)
			}

			await withRetry(
				() => docker.ping(),
				this.options.retryAttempts,
				this.options.retryDelay
			)

			const wasHealthy = this.lastHealthStatus.get(host.id)
			if (wasHealthy !== true) {
				this.lastHealthStatus.set(host.id, true)
				proxyEvent("host:health:changed", {
					healthy: true,
					hostId: host.id,
					hostName: host.name,
				})
			}
		} catch (error) {
			const wasHealthy = this.lastHealthStatus.get(host.id)
			if (wasHealthy !== false) {
				this.lastHealthStatus.set(host.id, false)
				proxyEvent("host:health:changed", {
					healthy: false,
					hostId: host.id,
					hostName: host.name,
				})
			}
			proxyEvent(
				"error",
				error instanceof Error ? error : new Error(String(error)),
				{ hostId: host.id, message: "Error while performing Health Checks" }
			)
		}
	}
}
