import Logger from "@dockstat/logger"

import type DB from "@dockstat/sqlite-wrapper"
import type { DATABASE, DOCKER } from "@dockstat/typings"
import Dockerode, { type ContainerStats } from "dockerode"
import HostHandler from "./hosts-handler/index"
import MonitoringManager from "./monitoring/MonitoringManager"
import { StreamManager } from "./stream/stream-manager"
import { withRetry } from "./utils/retry"
import {
	mapContainerInfo,
	mapContainerInfoFromInspect,
	mapContainerStats,
} from "./utils/mapper"
import { logger } from "../index"
import { proxyEvent } from "./events/workerEventProxy"

class DockerClient {
	private name: string
	private logger: Logger
	private hostHandler: HostHandler
	private dockerInstances: Map<number, Dockerode> = new Map()
	private activeStreams: Map<string, NodeJS.Timeout> = new Map()
	private options: Required<
		Omit<DOCKER.DockerAdapterOptions, "monitoringOptions">
	> & {
		monitoringOptions?: DOCKER.DockerAdapterOptions["monitoringOptions"]
	}
	private monitoringManager?: MonitoringManager
	private streamManager?: StreamManager
	private disposed = false
	private startTime = Date.now()
	private clientId: number

	constructor(
		id: number,
		name: string,
		DB: DB,
		options: DOCKER.DockerAdapterOptions = {}
	) {
		this.clientId = id
		this.logger = new Logger(
			`DockerClient-${id}`,
			logger.getParentsForLoggerChaining()
		)
		this.logger.info("Initializing DockerClient")
		this.hostHandler = new HostHandler(id, DB)
		this.options = {
			defaultTimeout: options.defaultTimeout ?? 5000,
			retryAttempts: options.retryAttempts ?? 3,
			retryDelay: options.retryDelay ?? 1000,
			enableMonitoring: options.enableMonitoring ?? true,
			enableEventEmitter: options.enableEventEmitter ?? true,
			monitoringOptions: options.monitoringOptions,
			execOptions: options.execOptions ?? {},
		}

		this.name = name

		this.logger.debug(`Monitoring enabled: ${this.options.enableMonitoring}`)
		if (this.options.enableMonitoring) {
			this.monitoringManager = new MonitoringManager(
				this.logger.getParentsForLoggerChaining(),
				this.dockerInstances,
				this.hostHandler.getHosts()
			)
		}

		this.streamManager = new StreamManager(
			this,
			this.logger.getParentsForLoggerChaining()
		)
	}

	private checkDisposed(): void {
		if (this.disposed) {
			throw new Error("DockerClient has been disposed")
		}
	}

	public getMetrics() {
		return {
			name: this.name,
			hostsManaged: this.dockerInstances.size,
			activeStreams: this.activeStreams.size,
			isMonitoring: this.isMonitoring(),
			uptime: Date.now() - this.startTime,
		}
	}

	public async ping(): Promise<{
		reachableInstances: number[]
		unreachableInstances: number[]
	}> {
		this.checkDisposed()
		this.logger.info("Testing ping to all instances")

		const clients = Array.from(this.dockerInstances.entries())
		if (clients.length === 0) {
			this.logger.info("No docker instances to ping")
			return { reachableInstances: [], unreachableInstances: [] }
		}

		const pingPromises = clients.map(([id, docker]) =>
			docker
				.ping()
				.then(() => ({ id, ok: true }))
				.catch((err) => {
					this.logger.debug(
						`Ping failed for instance ${id}: ${err?.message ?? err}`
					)
					return { id, ok: false }
				})
		)

		const settled = await Promise.all(pingPromises)
		const good: number[] = []
		const bad: number[] = []

		for (const res of settled) {
			if (res.ok) good.push(res.id)
			else bad.push(res.id)
		}

		this.logger.info(
			`Ping complete: ${good.length} healthy, ${bad.length} unhealthy`
		)
		return { reachableInstances: good, unreachableInstances: bad }
	}

	public addHost(host: DATABASE.DB_target_host): DATABASE.DB_target_host {
		this.checkDisposed()

		if (!Number(host.id)) {
			this.logger.info(`Adding new host: ${host.name}`)
			host.id = this.hostHandler.addHost(host)
		} else {
			this.logger.info(
				`Host ${host.name} (${Number(host.id)}) already exists. Initializing...`
			)
		}

		const instanceCfg: Dockerode.DockerOptions = {
			host: host.host,
			protocol: host.secure ? "https" : "http",
			port: host.port,
			timeout: this.options.defaultTimeout,
		}

		this.logger.info(
			`Creating new Docker Instance ${JSON.stringify(instanceCfg)}`
		)
		const dockerInstance = new Dockerode(instanceCfg)
		this.dockerInstances.set(Number(host.id), dockerInstance)

		if (this.monitoringManager) {
			this.monitoringManager.updateHosts(this.hostHandler.getHosts())
			this.monitoringManager.updateDockerInstances(this.dockerInstances)
		}

		proxyEvent("host:added", {
			hostId: Number(host.id),
			docker_client_id: Number(host.docker_client_id ?? 0),
			hostName: String(host.name),
		})
		return host as DATABASE.DB_target_host
	}

	public init(hosts = this.hostHandler.getHosts()): void {
		this.checkDisposed()
		this.logger.info("Initializing...")
		for (const host of hosts) {
			this.logger.info(`Initializing ${host.name} (${Number(host.id)})`)
			this.addHost(host)
		}
	}

	public removeHost(hostId: number): void {
		const hostName =
			this.getHosts().find((h) => h.id === hostId)?.name || "Unknown"
		this.checkDisposed()
		this.logger.info(`Removing host: ${hostName} (ID: ${hostId})`)
		this.hostHandler.removeHost(hostId)
		this.dockerInstances.delete(hostId)

		const streamsToRemove = Array.from(this.activeStreams.keys()).filter(
			(key) => key.includes(`host-${hostId}`)
		)

		for (const streamKey of streamsToRemove) {
			this.stopStream(streamKey)
		}

		if (this.monitoringManager) {
			this.monitoringManager.updateHosts(this.hostHandler.getHosts())
			this.monitoringManager.updateDockerInstances(this.dockerInstances)
		}

		proxyEvent("host:removed", { hostId, hostName })
	}

	public updateHost(host: DATABASE.DB_target_host): void {
		this.checkDisposed()
		this.logger.info(`Updating host: ${host.name} (ID: ${Number(host.id)})`)

		// Verify host exists in DB
		const existing = this.getHosts().find((h) => h.id === Number(host.id))
		if (!existing) {
			this.logger.error(`Host with ID ${Number(host.id)} not found for update`)
			throw new Error(`Host with ID ${Number(host.id)} not found`)
		}

		// Update the database record first
		try {
			this.hostHandler.updateHost(host)
			this.logger.info(`Host DB record updated for ID ${Number(host.id)}`)
		} catch (err) {
			this.logger.error(
				`Failed to update host record for ID ${Number(host.id)}: ${err}`
			)
			throw err
		}

		// Stop any active streams related to this host
		const streamsToRemove = Array.from(this.activeStreams.keys()).filter(
			(key) => key.includes(`host-${Number(host.id)}`)
		)
		for (const streamKey of streamsToRemove) {
			this.logger.debug(
				`Stopping stream ${streamKey} for updated host ${Number(host.id)}`
			)
			this.stopStream(streamKey)
		}

		// Replace or create Docker instance for this host
		try {
			const instanceCfg: Dockerode.DockerOptions = {
				host: host.host,
				protocol: host.secure ? "https" : "http",
				port: host.port,
				timeout: this.options.defaultTimeout,
			}

			this.logger.info(
				`Creating/updating Docker Instance for host ID ${Number(host.id)}: ${JSON.stringify(
					instanceCfg
				)}`
			)
			// Replace any existing instance
			this.dockerInstances.delete(Number(Number(host.id)))
			const dockerInstance = new Dockerode(instanceCfg)
			this.dockerInstances.set(Number(host.id), dockerInstance)
		} catch (err) {
			this.logger.error(
				`Failed to create Docker instance for updated host ${Number(host.id)}: ${err}`
			)
			// Re-throw to let callers handle; at this point DB is updated but docker instance may be inconsistent
			throw err
		}

		// Update monitoring manager if present
		if (this.monitoringManager) {
			try {
				this.monitoringManager.updateHosts(this.hostHandler.getHosts())
				this.monitoringManager.updateDockerInstances(this.dockerInstances)
				this.logger.info(
					`Monitoring manager updated for host ID ${Number(host.id)}`
				)
			} catch (err) {
				this.logger.error(
					`Failed to update monitoring manager for host ${Number(host.id)}: ${err}`
				)
			}
		}

		// Emit event to notify listeners
		proxyEvent("host:updated", { hostId: Number(host.id), hostName: host.name })
	}

	public getHosts(): DATABASE.DB_target_host[] {
		this.checkDisposed()
		return this.hostHandler.getHosts()
	}

	public async getAllContainers(): Promise<DOCKER.ContainerInfo[]> {
		this.checkDisposed()
		this.logger.info("Fetching containers from all hosts")
		const allContainers: DOCKER.ContainerInfo[] = []
		const hosts = this.hostHandler.getHosts()

		await Promise.allSettled(
			hosts.map(async (host) => {
				try {
					const containers = await this.getContainersForHost(Number(host.id))
					allContainers.push(...containers)
				} catch (error) {
					this.logger.error(
						`Failed to get containers for host ${host.name}: ${error}`
					)
					throw new Error(`Failed to get containers for host ${host.name}`)
				}
			})
		)

		return allContainers
	}

	public async getContainersForHost(
		hostId: number
	): Promise<DOCKER.ContainerInfo[]> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const containers = await withRetry(
			() => docker.listContainers({ all: true }),
			this.options.retryAttempts,
			this.options.retryDelay
		)

		return containers.map((container) => mapContainerInfo(container, hostId))
	}

	public async getContainer(
		hostId: number,
		containerId: string
	): Promise<DOCKER.ContainerInfo> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		const containerInfo = await withRetry(
			() => container.inspect(),
			this.options.retryAttempts,
			this.options.retryDelay
		)

		return mapContainerInfoFromInspect(containerInfo, hostId)
	}

	public async getAllContainerStats(): Promise<DOCKER.ContainerStatsInfo[]> {
		this.checkDisposed()
		const allStats: DOCKER.ContainerStatsInfo[] = []
		const hosts = this.hostHandler.getHosts()

		await Promise.allSettled(
			hosts.map(async (host) => {
				try {
					const stats = await this.getContainerStatsForHost(Number(host.id))
					allStats.push(...stats)
				} catch (error) {
					this.logger.error(
						`Failed to get container stats for host ${host.name}: ${error}`
					)
				}
			})
		)

		return allStats
	}

	public async getContainerStatsForHost(
		hostId: number
	): Promise<DOCKER.ContainerStatsInfo[]> {
		this.checkDisposed()
		const containers = await this.getContainersForHost(hostId)
		const runningContainers = containers.filter((c) => c.state === "running")

		const statsPromises = runningContainers.map(async (container) => {
			try {
				return await this.getContainerStats(hostId, container.id)
			} catch (error) {
				this.logger.error(
					`Failed to get stats for container ${container.name}: ${error}`
				)
				return null
			}
		})

		const results = await Promise.allSettled(statsPromises)
		return results
			.filter(
				(result): result is PromiseFulfilledResult<DOCKER.ContainerStatsInfo> =>
					result.status === "fulfilled" && result.value !== null
			)
			.map((result) => result.value)
	}

	public async getContainerStats(
		hostId: number,
		containerId: string
	): Promise<DOCKER.ContainerStatsInfo> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)

		const [containerInfo, stats] = await Promise.all([
			withRetry(
				() => container.inspect(),
				this.options.retryAttempts,
				this.options.retryDelay
			),
			withRetry(
				() => container.stats({ stream: false }),
				this.options.retryAttempts,
				this.options.retryDelay
			),
		])

		const mappedInfo = mapContainerInfoFromInspect(containerInfo, hostId)
		return mapContainerStats(mappedInfo, stats as ContainerStats)
	}

	public async getAllHostMetrics(): Promise<DOCKER.HostMetrics[]> {
		this.checkDisposed()
		const hosts = this.hostHandler.getHosts()
		const metricsPromises = hosts.map(async (host) => {
			try {
				return await this.getHostMetrics(Number(host.id))
			} catch (error) {
				this.logger.error(
					`Failed to get metrics for host ${host.name}: ${error}`
				)
				return null
			}
		})

		const results = await Promise.allSettled(metricsPromises)
		return results
			.filter(
				(result): result is PromiseFulfilledResult<DOCKER.HostMetrics> =>
					result.status === "fulfilled" && result.value !== null
			)
			.map((result) => result.value)
	}

	public async getAllStats(): Promise<DOCKER.AllStatsResponse> {
		this.checkDisposed()
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

	public async getHostMetrics(hostId: number): Promise<DOCKER.HostMetrics> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const host = this.hostHandler.getHosts().find((h) => h.id === hostId)

		if (!host) {
			throw new Error(`Host with ID ${hostId} not found`)
		}

		const [info, version] = await Promise.all([
			withRetry(
				() => docker.info(),
				this.options.retryAttempts,
				this.options.retryDelay
			),
			withRetry(
				() => docker.version(),
				this.options.retryAttempts,
				this.options.retryDelay
			),
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

	public startContainerStatsStream(
		hostId: number,
		containerId: string,
		callback: DOCKER.StreamCallback,
		interval = 1000
	): string {
		this.checkDisposed()
		const streamKey = `container-stats-${hostId}-${containerId}`

		if (this.activeStreams.has(streamKey)) {
			this.stopStream(streamKey)
		}

		const timer = setInterval(async () => {
			try {
				const stats = await this.getContainerStats(hostId, containerId)
				callback({
					type: "container_stats",
					hostId,
					timestamp: Date.now(),
					data: stats,
				})
			} catch (error) {
				callback({
					type: "error",
					hostId,
					timestamp: Date.now(),
					data: {
						error:
							error instanceof Error
								? new Error(error.message)
								: new Error("Unknown error"),
					},
				})
			}
		}, interval)

		this.activeStreams.set(streamKey, timer)
		return streamKey
	}

	public startHostMetricsStream(
		hostId: number,
		callback: DOCKER.StreamCallback,
		interval = 5000
	): string {
		this.checkDisposed()
		const streamKey = `host-metrics-${hostId}`

		if (this.activeStreams.has(streamKey)) {
			this.stopStream(streamKey)
		}

		const timer = setInterval(async () => {
			try {
				const metrics = await this.getHostMetrics(hostId)
				callback({
					type: "host_metrics",
					hostId,
					timestamp: Date.now(),
					data: metrics,
				})
			} catch (error) {
				callback({
					type: "error",
					hostId,
					timestamp: Date.now(),
					data: {
						error:
							error instanceof Error
								? new Error(error.message)
								: new Error("Unknown error"),
					},
				})
			}
		}, interval)

		this.activeStreams.set(streamKey, timer)
		return streamKey
	}

	public startAllContainersStream(
		callback: DOCKER.StreamCallback,
		interval = 2000
	): string {
		this.checkDisposed()
		const streamKey = "all-containers"

		if (this.activeStreams.has(streamKey)) {
			this.stopStream(streamKey)
		}

		const timer = setInterval(async () => {
			try {
				const containers = await this.getAllContainers()
				callback({
					type: "container_list",
					hostId: -1,
					timestamp: Date.now(),
					data: containers,
				})
			} catch (error) {
				callback({
					type: "error",
					hostId: -1,
					timestamp: Date.now(),
					data: {
						error:
							error instanceof Error
								? new Error(error.message)
								: new Error("Unknown error"),
					},
				})
			}
		}, interval)

		this.activeStreams.set(streamKey, timer)
		return streamKey
	}

	public startAllStatsStream(
		callback: DOCKER.StreamCallback,
		interval = 5000
	): string {
		this.checkDisposed()
		const streamKey = "all-stats"

		if (this.activeStreams.has(streamKey)) {
			this.stopStream(streamKey)
		}

		const timer = setInterval(async () => {
			try {
				const allStats = await this.getAllStats()
				callback({
					type: "all_stats",
					hostId: -1,
					timestamp: Date.now(),
					data: allStats,
				})
			} catch (error) {
				callback({
					type: "error",
					hostId: -1,
					timestamp: Date.now(),
					data: {
						error:
							error instanceof Error
								? new Error(error.message)
								: new Error("Unknown error"),
					},
				})
			}
		}, interval)

		this.activeStreams.set(streamKey, timer)
		return streamKey
	}

	public stopStream(streamKey: string): boolean {
		const timer = this.activeStreams.get(streamKey)
		if (timer) {
			clearInterval(timer)
			this.activeStreams.delete(streamKey)
			return true
		}
		return false
	}

	public stopAllStreams(): void {
		for (const [, timer] of Array.from(this.activeStreams)) {
			clearInterval(timer)
		}
		this.activeStreams.clear()
	}

	public getActiveStreams(): string[] {
		return Array.from(this.activeStreams.keys())
	}

	public async startContainer(
		hostId: number,
		containerId: string
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.start(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async stopContainer(
		hostId: number,
		containerId: string
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.stop(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async restartContainer(
		hostId: number,
		containerId: string
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.restart(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async removeContainer(
		hostId: number,
		containerId: string,
		force = false
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.remove({ force }),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async pauseContainer(
		hostId: number,
		containerId: string
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.pause(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async unpauseContainer(
		hostId: number,
		containerId: string
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.unpause(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async killContainer(
		hostId: number,
		containerId: string,
		signal = "SIGKILL"
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.kill({ signal }),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async renameContainer(
		hostId: number,
		containerId: string,
		newName: string
	): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)
		await withRetry(
			() => container.rename({ name: newName }),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

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
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const container = docker.getContainer(containerId)

		const logOptions = {
			stdout: options.stdout ?? true,
			stderr: options.stderr ?? true,
			timestamps: options.timestamps ?? false,
			tail: options.tail ?? 100,
			...options,
		}

		const logStream = await withRetry(
			() => container.logs(logOptions),
			this.options.retryAttempts,
			this.options.retryDelay
		)
		return logStream.toString()
	}

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
		this.checkDisposed()
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
			const exec = await withRetry(
				() => container.exec(execOptions),
				this.options.retryAttempts,
				this.options.retryDelay
			)

			const stream = await withRetry(
				() =>
					exec.start({
						Detach: false,
						Tty: options.tty ?? false,
					}),
				this.options.retryAttempts,
				this.options.retryDelay
			)

			return new Promise((resolve, reject) => {
				const chunks: Buffer[] = []

				stream.on("data", (chunk: Buffer) => {
					chunks.push(chunk)
				})

				stream.on("end", async () => {
					try {
						const combinedBuffer = Buffer.concat(chunks)
						let stdout = ""
						let stderr = ""

						if (options.tty) {
							stdout = combinedBuffer.toString()
						} else {
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

				stream.on("error", reject)

				setTimeout(() => reject(new Error("Exec operation timed out")), 30000)
			})
		} catch (error) {
			throw new Error(`Failed to execute command in container: ${error}`)
		}
	}

	public async getImages(hostId: number): Promise<Dockerode.ImageInfo[]> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		return await withRetry(
			() => docker.listImages(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async pullImage(hostId: number, imageName: string): Promise<void> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const stream = await docker.pull(imageName)

		return new Promise((resolve, reject) => {
			docker.modem.followProgress(stream, (err: unknown) => {
				if (err) reject(err)
				else resolve()
			})
		})
	}

	public async getNetworks(
		hostId: number
	): Promise<Dockerode.NetworkInspectInfo[]> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		return await withRetry(
			() => docker.listNetworks(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async getVolumes(
		hostId: number
	): Promise<Dockerode.VolumeInspectInfo[]> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		const result = await withRetry(
			() => docker.listVolumes(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
		return result.Volumes || []
	}

	public async checkHostHealth(hostId: number): Promise<boolean> {
		this.checkDisposed()
		try {
			const docker = this.getDockerInstance(hostId)
			await docker.ping()
			return true
		} catch {
			return false
		}
	}

	public async checkAllHostsHealth(): Promise<Record<number, boolean>> {
		this.checkDisposed()
		const hosts = this.hostHandler.getHosts()
		const healthChecks = await Promise.allSettled(
			hosts.map(async (host) => ({
				hostId: Number(host.id),
				healthy: await this.checkHostHealth(Number(host.id)),
			}))
		)

		const result = {} as Record<number, boolean>
		for (const check of healthChecks) {
			if (check.status === "fulfilled") {
				result[check.value.hostId] = check.value.healthy
			}
		}

		return result
	}

	public async getSystemInfo(
		hostId: number
	): Promise<DOCKER.DockerAPIResponse["systemInfo"]> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		return await withRetry(
			() => docker.info(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async getSystemVersion(hostId: number) {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		return await withRetry(
			() => docker.version(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async getDiskUsage(
		hostId: number
	): Promise<DOCKER.DockerAPIResponse["diskUsage"]> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		return await withRetry(
			() => docker.df(),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public async pruneSystem(
		hostId: number
	): Promise<{ SpaceReclaimed: number }> {
		this.checkDisposed()
		const docker = this.getDockerInstance(hostId)
		return await withRetry(
			() => docker.pruneImages({ dangling: false }),
			this.options.retryAttempts,
			this.options.retryDelay
		)
	}

	public startMonitoring(): void {
		this.checkDisposed()
		if (this.monitoringManager) {
			this.monitoringManager.startMonitoring()
		} else {
			proxyEvent(
				"warning",
				`Monitoring manager not initialized on ${this.name}`
			)
		}
	}

	public stopMonitoring(): void {
		if (this.monitoringManager) {
			this.monitoringManager.stopMonitoring()
		}
	}

	public isMonitoring(): boolean {
		return this.monitoringManager?.getMonitoringState().isMonitoring ?? false
	}

	public getStreamManager(): StreamManager | undefined {
		return this.streamManager
	}

	public createStreamConnection(connectionId: string): void {
		if (this.streamManager) {
			this.streamManager.createConnection(connectionId)
		}
	}

	public closeStreamConnection(connectionId: string): void {
		if (this.streamManager) {
			this.streamManager.closeConnection(connectionId)
		}
	}

	public handleStreamMessage(connectionId: string, message: string): void {
		if (this.streamManager) {
			this.streamManager.handleMessage(connectionId, message)
		}
	}

	private getDockerInstance(hostId: number): Dockerode {
		const docker = this.dockerInstances.get(hostId)
		if (!docker) {
			throw new Error(`No Docker instance found for host ID: ${hostId}`)
		}
		return docker
	}

	public async cleanup(): Promise<void> {
		this.disposed = true
		this.stopMonitoring()
		this.stopAllStreams()

		if (this.streamManager) {
			this.streamManager.cleanup()
		}

		this.dockerInstances.clear()
	}
}

export default DockerClient
