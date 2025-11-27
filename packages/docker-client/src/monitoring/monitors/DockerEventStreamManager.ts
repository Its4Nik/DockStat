import type { DATABASE, DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import Logger from "@dockstat/logger"
import { proxyEvent } from "../../events/workerEventProxy"
import { withRetry } from "../utils/retry"
import { mapContainerInfoFromInspect } from "../utils/containerMapper"

const logger = new Logger("DockerEventStreamManager")

export class DockerEventStreamManager {
	private streams = new Map<number, NodeJS.ReadableStream>()

	constructor(
		private dockerInstances: Map<number, Dockerode>,
		private hosts: DATABASE.DB_target_host[],
		private options: { retryAttempts: number; retryDelay: number }
	) {}

	start(): void {
		logger.info(`Starting Docker event streams for ${this.hosts.length} hosts`)
		for (const host of this.hosts) {
			this.startStreamForHost(host)
		}
	}

	stop(): void {
		this.streams.forEach((stream, hostId) => {
			try {
				if ("destroy" in stream && typeof stream.destroy === "function") {
					stream.destroy()
				}
			} catch (error) {
				proxyEvent(
					"error",
					error instanceof Error ? error : new Error(String(error)),
					{ hostId, message: "Could not Stop Docker Event Streams" }
				)
			}
		})
		this.streams.clear()
	}

	restart(): void {
		this.stop()
		this.start()
	}

	updateHosts(hosts: DATABASE.DB_target_host[]): void {
		this.hosts = hosts
	}

	updateDockerInstances(instances: Map<number, Dockerode>): void {
		this.dockerInstances = instances
	}

	getStreams(): Map<number, NodeJS.ReadableStream> {
		return new Map(this.streams)
	}

	private startStreamForHost(host: DATABASE.DB_target_host): void {
		try {
			const docker = this.dockerInstances.get(host.id)
			if (!docker) {
				throw new Error(`No Docker instance found for host ${host.id}`)
			}

			docker
				.getEvents({
					filters: {
						type: ["container"],
						event: ["start", "stop", "die", "create", "destroy"],
					},
				})
				.then((stream) => {
					stream.on("data", (chunk: Buffer) => {
						try {
							const info = JSON.parse(chunk.toString()) as {
								Action: string
								Actor?: { ID: string }
							}
							this.handleEvent(host.id, info)
						} catch (error) {
							proxyEvent(
								"error",
								error instanceof Error ? error : new Error(String(error)),
								{ hostId: host.id, message: "Failed to handle Docker Event" }
							)
						}
					})

					stream.on("error", (error: Error) => {
						proxyEvent("error", error, {
							hostId: host.id,
							message: "Docker event Stream failed",
						})
					})

					this.streams.set(host.id, stream)
				})
				.catch((error) => {
					proxyEvent(
						"error",
						error instanceof Error ? error : new Error(String(error)),
						{ hostId: host.id, message: "Failed to Start docker event Stream" }
					)
				})
		} catch (error) {
			proxyEvent(
				"error",
				error instanceof Error ? error : new Error(String(error)),
				{ hostId: host.id, message: "Could not Start docker event Stream" }
			)
		}
	}

	private handleEvent(
		hostId: number,
		event: { Action: string; Actor?: { ID: string } }
	): void {
		const containerId = event.Actor?.ID
		if (!containerId) return

		switch (event.Action) {
			case "start":
				this.getContainerInfo(hostId, containerId)
					.then((containerInfo) => {
						proxyEvent("container:started", {
							containerId,
							containerInfo,
							hostId,
						})
					})
					.catch((error) => {
						proxyEvent("error", error, {
							containerId,
							hostId,
							message: "Could not handle docker Start Event",
						})
					})
				break
			case "stop":
				this.getContainerInfo(hostId, containerId)
					.then((containerInfo) => {
						proxyEvent("container:stopped", {
							containerId,
							containerInfo,
							hostId,
						})
					})
					.catch((error) =>
						proxyEvent("error", error, {
							containerId,
							hostId,
							message: "Could not Handle docker Stop event",
						})
					)
				break
			case "die":
				proxyEvent("container:died", { containerId, hostId })
				break
			case "create":
				this.getContainerInfo(hostId, containerId)
					.then((containerInfo) =>
						proxyEvent("container:created", {
							containerId,
							containerInfo,
							hostId,
						})
					)
					.catch((error) =>
						proxyEvent("error", error, {
							containerId,
							hostId,
							message: "Could not handle container create event",
						})
					)
				break
			case "destroy":
				proxyEvent("container:destroyed", { containerId, hostId })
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
		const info = await withRetry<DOCKER.DockerAPIResponse["containerInspect"]>(
			() => container.inspect(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
		return mapContainerInfoFromInspect(info, hostId)
	}
}
