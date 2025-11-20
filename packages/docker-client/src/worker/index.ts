import DockerClient from '../docker-client'
import type { WorkerRequest, WorkerResponse } from '../types'

declare var self: Worker

let client: DockerClient | null = null
let clientId: number
let clientName: string

// Handle initialization message
self.onmessage = async (event: MessageEvent) => {
	const message = event.data

	// Handle initialization
	if (message.type === '__init__') {
		try {
			const { default: DB } = await import('@dockstat/sqlite-wrapper')
			const dbInstance = new DB(message.dbPath)

			clientId = message.clientId
			clientName = message.clientName

			client = new DockerClient(
				clientId,
				clientName,
				dbInstance,
				message.options
			)

			client.init()

			self.postMessage({
				type: '__init_complete__',
				success: true,
			})
			return
		} catch (error) {
			self.postMessage({
				type: '__init_complete__',
				success: false,
				error: error instanceof Error ? error.message : String(error),
			})
			return
		}
	}

	// Handle metrics request
	if (message.type === '__get_metrics__') {
		if (!client) {
			self.postMessage({
				type: '__metrics__',
				data: null,
			})
			return
		}

		self.postMessage({
			type: '__metrics__',
			data: {
				...client.getMetrics(),
				clientId,
				clientName,
			},
		})
		return
	}

	// Handle regular requests
	const request = message as WorkerRequest

	try {
		if (!client) {
			throw new Error('DockerClient not initialized')
		}

		let result: unknown

		switch (request.type) {
			case 'init':
				client.init(request.hosts)
				result = undefined
				break

			case 'ping':
				result = await client.ping()
				break

			case 'addHost':
				result = client.addHost(
					request.data.hostname,
					request.data.name,
					request.data.secure,
					request.data.port,
					request.data.id
				)
				break

			case 'removeHost': {
				result = client.removeHost(request.hostId)
				break
			}

			case 'updateHost':
				result = client.updateHost(request.host)
				break

			case 'getHosts':
				result = client.getHosts()
				break

			case 'getAllContainers':
				result = await client.getAllContainers()
				break

			case 'getContainersForHost':
				result = await client.getContainersForHost(request.hostId)
				break

			case 'getContainer':
				result = await client.getContainer(
					request.hostId,
					request.containerId
				)
				break

			case 'getAllContainerStats':
				result = await client.getAllContainerStats()
				break

			case 'getContainerStatsForHost':
				result = await client.getContainerStatsForHost(request.hostId)
				break

			case 'getContainerStats':
				result = await client.getContainerStats(
					request.hostId,
					request.containerId
				)
				break

			case 'getAllHostMetrics':
				result = await client.getAllHostMetrics()
				break

			case 'getHostMetrics':
				result = await client.getHostMetrics(request.hostId)
				break

			case 'getAllStats':
				result = await client.getAllStats()
				break

			case 'startContainer':
				await client.startContainer(request.hostId, request.containerId)
				result = undefined
				break

			case 'stopContainer':
				await client.stopContainer(request.hostId, request.containerId)
				result = undefined
				break

			case 'restartContainer':
				await client.restartContainer(request.hostId, request.containerId)
				result = undefined
				break

			case 'removeContainer':
				await client.removeContainer(
					request.hostId,
					request.containerId,
					request.force
				)
				result = undefined
				break

			case 'pauseContainer':
				await client.pauseContainer(request.hostId, request.containerId)
				result = undefined
				break

			case 'unpauseContainer':
				await client.unpauseContainer(request.hostId, request.containerId)
				result = undefined
				break

			case 'killContainer':
				await client.killContainer(
					request.hostId,
					request.containerId,
					request.signal
				)
				result = undefined
				break

			case 'renameContainer':
				await client.renameContainer(
					request.hostId,
					request.containerId,
					request.newName
				)
				result = undefined
				break

			case 'getContainerLogs':
				result = await client.getContainerLogs(
					request.hostId,
					request.containerId,
					request.options
				)
				break

			case 'execInContainer':
				result = await client.execInContainer(
					request.hostId,
					request.containerId,
					request.command,
					request.options
				)
				break

			case 'getImages':
				result = await client.getImages(request.hostId)
				break

			case 'pullImage':
				await client.pullImage(request.hostId, request.imageName)
				result = undefined
				break

			case 'getNetworks':
				result = await client.getNetworks(request.hostId)
				break

			case 'getVolumes':
				result = await client.getVolumes(request.hostId)
				break

			case 'checkHostHealth':
				result = await client.checkHostHealth(request.hostId)
				break

			case 'checkAllHostsHealth':
				result = await client.checkAllHostsHealth()
				break

			case 'getSystemInfo':
				result = await client.getSystemInfo(request.hostId)
				break

			case 'getSystemVersion':
				result = await client.getSystemVersion(request.hostId)
				break

			case 'getDiskUsage':
				result = await client.getDiskUsage(request.hostId)
				break

			case 'pruneSystem':
				result = await client.pruneSystem(request.hostId)
				break

			case 'startMonitoring':
				client.startMonitoring()
				result = undefined
				break

			case 'stopMonitoring':
				client.stopMonitoring()
				result = undefined
				break

			case 'isMonitoring':
				result = client.isMonitoring()
				break

			case 'cleanup':
				await client.cleanup()
				result = undefined
				break

			default:
				throw new Error(
					`Unknown request type: ${JSON.stringify(request)}`
				)
		}

		const response: WorkerResponse = {
			success: true,
			data: result,
		}
		self.postMessage(response)
	} catch (error) {
		const response: WorkerResponse = {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		}
		self.postMessage(response)
	}
}
