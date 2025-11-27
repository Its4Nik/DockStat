// monitors/ContainerEventMonitor.ts
import type { DATABASE, DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import Logger from "@dockstat/logger"
import { proxyEvent } from "../../events/workerEventProxy"
import { withRetry } from "../utils/retry"
import { mapContainerInfo } from "../utils/containerMapper"

const logger = new Logger("ContainerEventMonitor")

export class ContainerEventMonitor {
	private intervalId?: ReturnType<typeof setInterval>
	private lastContainerStates = new Map<string, DOCKER.ContainerInfo[]>()

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
		logger.info(
			`Starting container event monitoring at interval ${this.options.interval}ms`
		)
		this.intervalId = setInterval(
			() => this.monitorChanges(),
			this.options.interval
		)
		this.captureInitialStates().catch((error) => {
			proxyEvent(
				"error",
				error instanceof Error ? error : new Error(String(error))
			)
		})
	}

	stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = undefined
		}
	}

	getLastContainerStates(): Map<string, DOCKER.ContainerInfo[]> {
		return new Map(this.lastContainerStates)
	}

	updateHosts(hosts: DATABASE.DB_target_host[]): void {
		this.hosts = hosts
	}

	updateDockerInstances(instances: Map<number, Dockerode>): void {
		this.dockerInstances = instances
	}

	private async captureInitialStates(): Promise<void> {
		const promises = this.hosts.map(async (host) => {
			try {
				const containers = await this.getContainersForHost(host.id)
				this.lastContainerStates.set(`host-${host.id}`, containers)
			} catch (error) {
				proxyEvent(
					"error",
					error instanceof Error ? error : new Error(String(error)),
					{ hostId: host.id }
				)
			}
		})
		await Promise.allSettled(promises)
	}

	private async monitorChanges(): Promise<void> {
		const promises = this.hosts.map(async (host) => {
			try {
				const current = await this.getContainersForHost(host.id)
				const last = this.lastContainerStates.get(`host-${host.id}`) || []
				this.detectChanges(host.id, last, current)
				this.lastContainerStates.set(`host-${host.id}`, current)
			} catch (error) {
				proxyEvent(
					"error",
					error instanceof Error ? error : new Error(String(error)),
					{ hostId: host.id }
				)
			}
		})
		await Promise.allSettled(promises)
	}

	private detectChanges(
		hostId: number,
		last: DOCKER.ContainerInfo[],
		current: DOCKER.ContainerInfo[]
	): void {
		const lastMap = new Map(last.map((c) => [c.id, c]))
		const currentMap = new Map(current.map((c) => [c.id, c]))

		for (const container of current) {
			if (!lastMap.has(container.id)) {
				proxyEvent("container:created", {
					containerId: container.id,
					containerInfo: container,
					hostId,
				})
			} else {
				const lastContainer = lastMap.get(container.id)
				if (lastContainer && lastContainer.state !== container.state) {
					if (
						container.state === "running" &&
						lastContainer.state !== "running"
					) {
						proxyEvent("container:started", {
							containerId: container.id,
							containerInfo: container,
							hostId,
						})
					} else if (
						container.state !== "running" &&
						lastContainer.state === "running"
					) {
						proxyEvent("container:stopped", {
							containerId: container.id,
							containerInfo: container,
							hostId,
						})
					}
				}
			}
		}

		for (const lastContainer of last) {
			if (!currentMap.has(lastContainer.id)) {
				proxyEvent("container:removed", {
					containerId: lastContainer.id,
					hostId,
				})
			}
		}
	}

	private async getContainersForHost(
		hostId: number
	): Promise<DOCKER.ContainerInfo[]> {
		const docker = this.dockerInstances.get(hostId)
		if (!docker) {
			throw new Error(`No Docker instance found for host ${hostId}`)
		}
		const containers = await withRetry(
			() => docker.listContainers({ all: true }),
			this.options.retryAttempts,
			this.options.retryDelay
		)
		return containers.map((c) => mapContainerInfo(c, hostId))
	}
}
