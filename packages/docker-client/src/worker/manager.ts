import Logger from '@dockstat/logger'
import type DB from '@dockstat/sqlite-wrapper'
import { column, type QueryBuilder } from '@dockstat/sqlite-wrapper'
import type { DATABASE, DOCKER } from '@dockstat/typings'
import type {
	PoolMetrics,
	WorkerMetrics,
	WorkerRequest,
	WorkerResponse,
} from '../types'
import { logger } from '../../'

interface WorkerWrapper {
	worker: Worker
	clientId: number
	clientName: string
	hostIds: Set<number>
	busy: boolean
	lastUsed: number
	initialized: boolean
}

type DockerClientTable = {
	id?: number
	name: string
	options: DOCKER.DockerAdapterOptions
}

export class DockerClientManager {
	private DB: DB
	private table: QueryBuilder<DockerClientTable>
	private logger = new Logger(
		'DCM',
		logger.getParentsForLoggerChaining()
	)
	private workers: Map<number, WorkerWrapper> = new Map()
	private maxWorkers: number
	private dbPath: string

	constructor(db: DB, options: { maxWorkers?: number } = {}) {
		this.logger.info('Creating Docker Client Manager')
		this.DB = db
		this.dbPath = db.getDb().filename
		this.maxWorkers = options.maxWorkers ?? 4

		this.table = this.DB.createTable<DockerClientTable>(
			'docker_clients',
			{
				id: column.id(),
				name: column.text({ unique: true }),
				options: column.json(),
			},
			{
				ifNotExists: true,
				parser: { JSON: ['options'] },
			}
		)

		this.logger.info('Initialized DB')
		this.logger.debug('Creating Workers for already existing Clients')

		const clients = this.table.select(['*']).all()

		for (const c of clients) {
			this.createWorker(c.id as number, c.name, c.options)
		}

		this.logger.info(
			`Initialized with max ${this.maxWorkers} workers, DB path: ${this.dbPath}`
		)
	}

	public async registerClient(
		name: string,
		options: DOCKER.DockerAdapterOptions = {}
	) {
		let dbStepDone = false
		try {
			this.logger.info(`Registering client: ${name}`)

			// Insert into database
			this.table.insert({
				name,
				options: options,
			})

			const { id: clientId } = this.table
				.select(['id'])
				.where({ name: name })
				.first() || { id: undefined }

			if (!clientId) {
				throw new Error(`No client with the name ${name} found in the DB`)
			}

			dbStepDone = true
			this.logger.debug('Client added to DB')

			// Create worker
			await this.createWorker(clientId, name, options)

			const msg = `Client ${name} successfully registered with ID: ${clientId}`

			this.logger.info(msg)
			return {
				success: true,
				message: msg,
				clientId: clientId,
			}
		} catch (error: unknown) {
			const msg = `Error while registering Client ${name} ${dbStepDone ?? ', the CLient was already registered in the DB. It will be automatically removed'} - error: ${JSON.stringify(error)}`

			this.logger.error(msg)
			if (dbStepDone) {
				this.table.where({ name: name }).delete()
				this.logger.info('Orphan Client has been removed')
			}

			return {
				success: false,
				error: error,
				message: msg,
			}
		}
	}

	private async createWorker(
		clientId: number,
		clientName: string,
		options: DOCKER.DockerAdapterOptions
	): Promise<void> {
		try {
			if (this.workers.size >= this.maxWorkers) {
				throw new Error(
					`Maximum number of workers (${this.maxWorkers}) reached`
				)
			}

			this.logger.debug(`Creating worker for client ${clientId}`)

			// Create worker using Bun's Worker API
			const worker = new Worker(new URL('./index.ts', import.meta.url))

			const wrapper: WorkerWrapper = {
				worker,
				clientId,
				clientName,
				hostIds: new Set(),
				busy: false,
				lastUsed: Date.now(),
				initialized: false,
			}

			// Handle errors
			worker.addEventListener('error', (error) => {
				this.logger.error(
					`Worker ${clientId} error: ${JSON.stringify(error)}`
				)
				this.handleWorkerError(clientId, error)
				throw new Error(JSON.stringify(error))
			})

			// Store wrapper
			this.workers.set(clientId, wrapper)

			// Initialize the worker
			await this.initializeWorker(clientId, clientName, options)
		} catch (error: unknown) {
			throw new Error(String(error))
		}
	}

	private async initializeWorker(
		clientId: number,
		clientName: string,
		options: DOCKER.DockerAdapterOptions
	): Promise<void> {
		const wrapper = this.workers.get(clientId)
		if (!wrapper) {
			throw new Error(`Worker ${clientId} not found`)
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Worker initialization timeout'))
			}, 30000)

			const initHandler = (event: MessageEvent) => {
				const message = event.data
				if (message.type === '__init_complete__') {
					clearTimeout(timeout)
					wrapper.worker.removeEventListener('message', initHandler)

					if (message.success) {
						wrapper.initialized = true
						this.logger.info(`Worker ${clientId} initialized successfully`)
						resolve()
					} else {
						reject(new Error(`Worker init failed: ${message.error}`))
					}
				}
			}

			wrapper.worker.addEventListener('message', initHandler)

			// Send initialization message
			wrapper.worker.postMessage({
				type: '__init__',
				clientId,
				clientName,
				dbPath: this.dbPath,
				options,
			})
		})
	}

	private handleWorkerError(
		clientId: number,
		error: ErrorEvent
	): void {
		const wrapper = this.workers.get(clientId)
		if (!wrapper) return

		// Terminate and cleanup
		wrapper.worker.terminate()
		this.workers.delete(clientId)

		this.logger.error(
			`Worker ${clientId} terminated due to error: ${error.message}`
		)
	}

	private async sendRequest<T>(
		clientId: number,
		request: WorkerRequest
	): Promise<T> {
		const wrapper = this.workers.get(clientId)
		if (!wrapper) {
			throw new Error(`No worker found for client ID: ${clientId}`)
		}

		if (!wrapper.initialized) {
			throw new Error(`Worker ${clientId} not initialized`)
		}

		return new Promise((resolve, reject) => {
			wrapper.busy = true
			wrapper.lastUsed = Date.now()

			const timeout = setTimeout(() => {
				wrapper.busy = false
				wrapper.worker.removeEventListener('message', messageHandler)
				reject(new Error('Request timeout'))
			}, 30000)

			const messageHandler = (event: MessageEvent) => {
				const response = event.data as WorkerResponse<T>

				// Ignore internal messages
				if (
					response &&
					typeof response === 'object' &&
					'type' in response &&
					(response.type === '__init_complete__' ||
						response.type === '__metrics__')
				) {
					return
				}

				clearTimeout(timeout)
				wrapper.busy = false
				wrapper.worker.removeEventListener('message', messageHandler)

				if (response.success) {
					resolve(response.data)
				} else {
					reject(new Error(response.error))
				}
			}

			wrapper.worker.addEventListener('message', messageHandler)
			wrapper.worker.postMessage(request)
		})
	}

	// Client Management
	public getClient(clientId: number): boolean {
		return this.workers.has(clientId)
	}

	public getAllClients(): Array<{ id: number; name: string }> {
		return Array.from(this.workers.values()).map((w) => ({
			id: w.clientId,
			name: w.clientName,
		}))
	}

	public async removeClient(clientId: number): Promise<void> {
		const wrapper = this.workers.get(clientId)
		if (!wrapper) {
			throw new Error(`No worker found for client ID: ${clientId}`)
		}

		try {
			await this.sendRequest(clientId, { type: 'cleanup' })
		} catch (error) {
			this.logger.warn(`Error cleaning up worker ${clientId}: ${error}`)
		}

		wrapper.worker.terminate()
		this.workers.delete(clientId)

		// Remove from database
		this.table.where({ id: clientId }).delete()

		this.logger.info(`Client ${clientId} removed`)
	}

	// Host Management (proxy to worker)
	public async init(
		clientId: number,
		hosts?: DATABASE.DB_target_host[]
	): Promise<void> {
		const actualHosts = hosts || []
		return this.sendRequest(clientId, {
			type: 'init',
			hosts: actualHosts,
		})
	}

	public async addHost(
		clientId: number,
		hostname: string,
		name: string,
		secure: boolean,
		port: number,
		id?: number
	): Promise<DATABASE.DB_target_host> {
		const result = await this.sendRequest<DATABASE.DB_target_host>(
			clientId,
			{
				type: 'addHost',
				data: { hostname, name, secure, port, id },
			}
		)

		const wrapper = this.workers.get(clientId)
		if (wrapper && result.id) {
			wrapper.hostIds.add(result.id)
		}

		return result
	}

	public async removeHost(
		clientId: number,
		hostId: number
	): Promise<void> {
		await this.sendRequest(clientId, {
			type: 'removeHost',
			hostId,
		})

		const wrapper = this.workers.get(clientId)
		if (wrapper) {
			wrapper.hostIds.delete(hostId)
		}
	}

	public async updateHost(
		clientId: number,
		host: DATABASE.DB_target_host
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'updateHost',
			host,
		})
	}

	public async getHosts(
		clientId: number
	): Promise<DATABASE.DB_target_host[]> {
		return this.sendRequest(clientId, { type: 'getHosts' })
	}

	public async getAllHosts() {
		const clients = this.getAllClients()
		const hosts: Array<{ name: string; id: number; clientId: number }> =
			[]
		for (const client of clients) {
			const clientsHosts = (await this.getHosts(client.id)).map((c) => {
				return { name: c.name, id: c.id, clientId: client.id }
			})
			hosts.concat(clientsHosts)
		}
		return hosts
	}

	public async ping(clientId: number) {
		return this.sendRequest(clientId, { type: 'ping' })
	}

	// Container Operations (proxy to worker)
	public async getAllContainers(
		clientId: number
	): Promise<DOCKER.ContainerInfo[]> {
		return this.sendRequest(clientId, { type: 'getAllContainers' })
	}

	public async getContainersForHost(
		clientId: number,
		hostId: number
	): Promise<DOCKER.ContainerInfo[]> {
		return this.sendRequest(clientId, {
			type: 'getContainersForHost',
			hostId,
		})
	}

	public async getContainer(
		clientId: number,
		hostId: number,
		containerId: string
	): Promise<DOCKER.ContainerInfo> {
		return this.sendRequest(clientId, {
			type: 'getContainer',
			hostId,
			containerId,
		})
	}

	// Container Stats (proxy to worker)
	public async getAllContainerStats(
		clientId: number
	): Promise<DOCKER.ContainerStatsInfo[]> {
		return this.sendRequest(clientId, { type: 'getAllContainerStats' })
	}

	public async getContainerStatsForHost(
		clientId: number,
		hostId: number
	): Promise<DOCKER.ContainerStatsInfo[]> {
		return this.sendRequest(clientId, {
			type: 'getContainerStatsForHost',
			hostId,
		})
	}

	public async getContainerStats(
		clientId: number,
		hostId: number,
		containerId: string
	): Promise<DOCKER.ContainerStatsInfo> {
		return this.sendRequest(clientId, {
			type: 'getContainerStats',
			hostId,
			containerId,
		})
	}

	// Host Metrics (proxy to worker)
	public async getAllHostMetrics(
		clientId: number
	): Promise<DOCKER.HostMetrics[]> {
		return this.sendRequest(clientId, { type: 'getAllHostMetrics' })
	}

	public async getHostMetrics(
		clientId: number,
		hostId: number
	): Promise<DOCKER.HostMetrics> {
		return this.sendRequest(clientId, {
			type: 'getHostMetrics',
			hostId,
		})
	}

	public async getAllStats(
		clientId: number
	): Promise<DOCKER.AllStatsResponse> {
		return this.sendRequest(clientId, { type: 'getAllStats' })
	}

	// Container Control (proxy to worker)
	public async startContainer(
		clientId: number,
		hostId: number,
		containerId: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'startContainer',
			hostId,
			containerId,
		})
	}

	public async stopContainer(
		clientId: number,
		hostId: number,
		containerId: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'stopContainer',
			hostId,
			containerId,
		})
	}

	public async restartContainer(
		clientId: number,
		hostId: number,
		containerId: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'restartContainer',
			hostId,
			containerId,
		})
	}

	public async removeContainer(
		clientId: number,
		hostId: number,
		containerId: string,
		force?: boolean
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'removeContainer',
			hostId,
			containerId,
			force,
		})
	}

	public async pauseContainer(
		clientId: number,
		hostId: number,
		containerId: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'pauseContainer',
			hostId,
			containerId,
		})
	}

	public async unpauseContainer(
		clientId: number,
		hostId: number,
		containerId: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'unpauseContainer',
			hostId,
			containerId,
		})
	}

	public async killContainer(
		clientId: number,
		hostId: number,
		containerId: string,
		signal?: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'killContainer',
			hostId,
			containerId,
			signal,
		})
	}

	public async renameContainer(
		clientId: number,
		hostId: number,
		containerId: string,
		newName: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'renameContainer',
			hostId,
			containerId,
			newName,
		})
	}

	public async getContainerLogs(
		clientId: number,
		hostId: number,
		containerId: string,
		options?: unknown
	): Promise<string> {
		return this.sendRequest(clientId, {
			type: 'getContainerLogs',
			hostId,
			containerId,
			options,
		})
	}

	public async execInContainer(
		clientId: number,
		hostId: number,
		containerId: string,
		command: string[],
		options?: unknown
	): Promise<{ stdout: string; stderr: string; exitCode: number }> {
		return this.sendRequest(clientId, {
			type: 'execInContainer',
			hostId,
			containerId,
			command,
			options,
		})
	}

	// Image Operations (proxy to worker)
	public async getImages(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: 'getImages',
			hostId,
		})
	}

	public async pullImage(
		clientId: number,
		hostId: number,
		imageName: string
	): Promise<void> {
		return this.sendRequest(clientId, {
			type: 'pullImage',
			hostId,
			imageName,
		})
	}

	// Network Operations (proxy to worker)
	public async getNetworks(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: 'getNetworks',
			hostId,
		})
	}

	// Volume Operations (proxy to worker)
	public async getVolumes(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: 'getVolumes',
			hostId,
		})
	}

	// Health Check (proxy to worker)
	public async checkHostHealth(
		clientId: number,
		hostId: number
	): Promise<boolean> {
		return this.sendRequest(clientId, {
			type: 'checkHostHealth',
			hostId,
		})
	}

	public async checkAllHostsHealth(
		clientId: number
	): Promise<Record<number, boolean>> {
		return this.sendRequest(clientId, {
			type: 'checkAllHostsHealth',
		})
	}

	// System Operations (proxy to worker)
	public async getSystemInfo(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: 'getSystemInfo',
			hostId,
		})
	}

	public async getSystemVersion(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: 'getSystemVersion',
			hostId,
		})
	}

	public async getDiskUsage(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: 'getDiskUsage',
			hostId,
		})
	}

	public async pruneSystem(clientId: number, hostId: number) {
		return this.sendRequest(clientId, {
			type: 'pruneSystem',
			hostId,
		})
	}

	// Monitoring (proxy to worker)
	public async startMonitoring(clientId: number): Promise<void> {
		return this.sendRequest(clientId, { type: 'startMonitoring' })
	}

	public async stopMonitoring(clientId: number): Promise<void> {
		return this.sendRequest(clientId, { type: 'stopMonitoring' })
	}

	public async isMonitoring(clientId: number): Promise<boolean> {
		return this.sendRequest(clientId, { type: 'isMonitoring' })
	}

	// Pool Metrics
	public async getPoolMetrics(): Promise<PoolMetrics> {
		const workers: WorkerMetrics[] = []
		let totalHosts = 0

		for (const [clientId, wrapper] of this.workers) {
			totalHosts += wrapper.hostIds.size

			// Try to get monitoring status
			let isMonitoring = false
			try {
				isMonitoring = await this.isMonitoring(clientId)
			} catch {
				// Ignore errors
			}

			const workerMetrics: WorkerMetrics = {
				workerId: clientId, // Bun workers don't expose threadId directly
				clientId: wrapper.clientId,
				clientName: wrapper.clientName,
				hostsManaged: wrapper.hostIds.size,
				activeStreams: 0,
				isMonitoring,
				memoryUsage: Bun.nanoseconds()
					? undefined
					: process.memoryUsage(),
				uptime: Date.now() - wrapper.lastUsed,
			}

			workers.push(workerMetrics)
		}

		return {
			totalWorkers: this.workers.size,
			activeWorkers: Array.from(this.workers.values()).filter(
				(w) => !w.busy
			).length,
			totalHosts,
			totalClients: this.workers.size,
			averageHostsPerWorker:
				this.workers.size > 0 ? totalHosts / this.workers.size : 0,
			workers,
		}
	}

	public async getWorkerMetrics(
		clientId: number
	): Promise<WorkerMetrics | null> {
		const wrapper = this.workers.get(clientId)
		if (!wrapper) return null

		let isMonitoring = false
		try {
			isMonitoring = await this.isMonitoring(clientId)
		} catch {
			// Ignore
		}

		return {
			workerId: clientId,
			clientId: wrapper.clientId,
			clientName: wrapper.clientName,
			hostsManaged: wrapper.hostIds.size,
			activeStreams: 0,
			isMonitoring,
			memoryUsage: process.memoryUsage(),
			uptime: Date.now() - wrapper.lastUsed,
		}
	}

	// Cleanup
	public async dispose(): Promise<void> {
		this.logger.info('Disposing DockerClientManager')

		const cleanupPromises = Array.from(this.workers.keys()).map(
			(clientId) =>
				this.removeClient(clientId).catch((err) => {
					this.logger.error(`Error removing client ${clientId}: ${err}`)
				})
		)

		await Promise.allSettled(cleanupPromises)
		this.workers.clear()

		this.logger.info('DockerClientManager disposed')
	}
}
