import type {
	ContainerInspectInfo,
	ContainerStats,
	Version,
} from 'dockerode'
import { t } from 'elysia'

export interface SysInfo {
	OperatingSystem: string
	Architecture: string
	MemTotal: number
	NCPU: number
	KernelVersion: string
	Containers: number
	ContainersRunning: number
	ContainersStopped: number
	ContainersPaused: number
	Images: number
	SystemTime: string
}

export interface DockerAPIResponse {
	systemInfo: SysInfo
	version: Version
	containerInspect: ContainerInspectInfo
	diskUsage: {
		LayersSize: number
		Images: Array<{
			Id: string
			ParentId: string
			RepoTags: string[]
			Created: number
			Size: number
			SharedSize: number
			VirtualSize: number
		}>
		Containers: Array<{
			Id: string
			Names: string[]
			Image: string
			ImageID: string
			Created: number
			State: string
			Status: string
			SizeRw: number
			SizeRootFs: number
		}>
		Volumes: Array<{
			Name: string
			Driver: string
			Mountpoint: string
			CreatedAt: string
			Size: number
		}>
	}
	containerLogs: {
		stdout: string
		stderr: string
		exitCode: number
	}
	execResult: {
		stdout: string
		stderr: string
		exitCode: number
	}
}

export type MonitoringOptions = {
	healthCheckInterval?: number
	containerEventPollingInterval?: number
	hostMetricsInterval?: number
	enableContainerEvents?: boolean
	enableHostMetrics?: boolean
	enableHealthChecks?: boolean
	retryAttempts?: number
	retryDelay?: number
}

export type ExecOptions = {
	workingDir?: string
	env?: string[]
	tty?: boolean
}

export interface DockerAdapterOptions {
	defaultTimeout?: number
	retryAttempts?: number
	retryDelay?: number
	enableMonitoring?: boolean
	enableEventEmitter?: boolean
	monitoringOptions?: MonitoringOptions
	execOptions?: ExecOptions
}

export const DockerAdapterOptionsSchema = t.Object({
	defaultTimeout: t.Partial(t.Number()),
	retryAttempts: t.Partial(t.Number()),
	retryDelay: t.Partial(t.Number()),
	enableMonitoring: t.Partial(t.Boolean()),
	enableEventEmitter: t.Partial(t.Boolean()),
	monitoringOptions: t.Partial(
		t.Object({
			healthCheckInterval: t.Partial(t.Number()),
			containerEventPollingInterval: t.Partial(t.Number()),
			hostMetricsInterval: t.Partial(t.Number()),
			enableContainerEvents: t.Partial(t.Boolean()),
			enableHostMetrics: t.Partial(t.Boolean()),
			enableHealthChecks: t.Partial(t.Boolean()),
			retryAttempts: t.Partial(t.Number()),
			retryDelay: t.Partial(t.Number()),
		})
	),
	execOptions: t.Partial(
		t.Object({
			workingDir: t.Partial(t.String()),
			env: t.Array(t.String()),
			tty: t.Partial(t.Boolean()),
		})
	),
})

export interface ContainerInfo {
	id: string
	hostId: number
	name: string
	image: string
	status: string
	state: string
	created: number
	ports: Array<{
		privatePort: number
		publicPort?: number
		type: string
	}>
	labels: Record<string, string>
	networkSettings?: {
		networks?: Record<string, unknown>
	}
}

export interface ContainerStatsInfo extends ContainerInfo {
	stats: ContainerStats
	cpuUsage: number
	memoryUsage: number
	memoryLimit: number
	networkRx: number
	networkTx: number
	blockRead: number
	blockWrite: number
}

export interface HostMetrics {
	hostId: number
	hostName: string
	dockerVersion: string
	apiVersion: string
	os: string
	architecture: string
	totalMemory: number
	totalCPU: number
	kernelVersion: string
	containers: number
	containersRunning: number
	containersStopped: number
	containersPaused: number
	images: number
	systemTime: string
	uptime?: number
}

export interface AllStatsResponse {
	containerStats: ContainerStatsInfo[]
	hostMetrics: HostMetrics[]
	timestamp: number
}

export interface StreamOptions {
	containerId?: string
	hostId?: number
	interval?: number
}

export interface DockerStreamData {
	type:
		| 'container_stats'
		| 'host_metrics'
		| 'container_list'
		| 'all_stats'
		| 'error'
	hostId: number
	timestamp: number
	data:
		| ContainerStats
		| ContainerStatsInfo
		| HostMetrics
		| ContainerInfo[]
		| AllStatsResponse
		| { error: Error }
}

export type StreamCallback = (data: DockerStreamData) => void
interface BaseCtx {
	logger: {
		debug: (msg: string) => void
		info: (msg: string) => void
		error: (msg: string) => void
		warn: (msg: string) => void
	}
}

interface BaseHostCtx extends BaseCtx {
	hostId: number
	hostName: string
}

interface HostHealthContext extends BaseHostCtx {
	healthy: boolean
}
interface HostMetricsContext extends BaseHostCtx {
	metrics: HostMetrics
}

interface ContainerBaseCtx extends BaseCtx {
	hostId: number
	containerId: string
}

interface ContainerStatsCtx extends ContainerBaseCtx {
	stats: ContainerStatsInfo
}

interface ContainerInfoCtx extends ContainerBaseCtx {
	containerInfo: ContainerInfo
}

interface BaseStreamCtx extends BaseCtx {
	streamKey: string
	streamType: string
}

interface StreamDataCtx extends BaseStreamCtx {
	data: DockerStreamData
}

interface StreamErrorCtx extends BaseStreamCtx {
	error: Error
}

export interface DockerClientEvents {
	'host:added': (ctx: BaseHostCtx) => void
	'host:removed': (ctx: BaseHostCtx) => void
	'host:updated': (ctx: BaseHostCtx) => void
	'host:health:changed': (ctx: HostHealthContext) => void
	'host:metrics': (ctx: HostMetricsContext) => void

	'container:stats': (ctx: ContainerStatsCtx) => void
	'container:started': (ctx: ContainerInfoCtx) => void
	'container:stopped': (ctx: ContainerInfoCtx) => void
	'container:removed': (ctx: ContainerBaseCtx) => void
	'container:created': (ctx: ContainerInfoCtx) => void
	'container:died': (ctx: ContainerBaseCtx) => void

	'stream:started': (ctx: BaseStreamCtx) => void
	'stream:stopped': (ctx: BaseStreamCtx) => void
	'stream:data': (ctx: StreamDataCtx) => void
	'stream:error': (ctx: StreamErrorCtx) => void

	error: (
		error: Error,
		context?: Record<
			string,
			{ hostId?: number; containerId?: string; message?: string }
		>
	) => void
	warning: (
		message: string,
		context?: Record<string, { hostId?: number; containerId?: string }>
	) => void
	info: (
		message: string,
		context?: Record<string, { hostId?: number; containerId?: string }>
	) => void
}

export interface DockerEventEmitterInterface {
	on<K extends keyof DockerClientEvents>(
		event: K,
		listener: DockerClientEvents[K]
	): this
	off<K extends keyof DockerClientEvents>(
		event: K,
		listener: DockerClientEvents[K]
	): this
	emit<K extends keyof DockerClientEvents>(
		event: K,
		...args: Parameters<DockerClientEvents[K]>
	): boolean
	once<K extends keyof DockerClientEvents>(
		event: K,
		listener: DockerClientEvents[K]
	): this
	removeAllListeners<K extends keyof DockerClientEvents>(
		event?: K
	): this
	listenerCount<K extends keyof DockerClientEvents>(event: K): number
}

export interface MonitoringState {
	isMonitoring: boolean
	healthCheckInterval?: NodeJS.Timeout
	containerEventInterval?: NodeJS.Timeout
	hostMetricsInterval?: NodeJS.Timeout
	lastHealthStatus: Map<number, boolean>
	lastContainerStates: Map<string, ContainerInfo[]>
	dockerEventStreams: Map<number, NodeJS.ReadableStream>
}

export interface StreamMessage {
	id: string
	type:
		| 'subscribe'
		| 'unsubscribe'
		| 'data'
		| 'error'
		| 'ping'
		| 'pong'
	channel?: string
	data?:
		| ContainerStatsInfo
		| HostMetrics
		| HostMetrics[]
		| ContainerInfo[]
		| ContainerLogs
		| AllStatsResponse
		| {
				eventType: string
				args: unknown[]
		  }
		| {
				subscriptionId: string
				channel: string
				status: 'subscribed' | 'unsubscribed' | 'not_found'
				options: StreamOptions
		  }
	timestamp: number
	error?: string
}

export interface ContainerLogs {
	logs: string[]
	containerId: string
	hostId: number
	timestamp: number
}

export interface StreamSubscription {
	id: string
	channel: string
	options: StreamOptions
	callback: (message: StreamMessage) => void
	active: boolean
	lastActivity: number
}

export interface StreamOptions {
	hostId?: number
	containerId?: string
	interval?: number
	includeStats?: boolean
	includeMetrics?: boolean
	includeLogs?: boolean
	logLines?: number
	filters?: {
		containerNames?: string[]
		containerStates?: string[]
		imageNames?: string[]
	}
}

export interface StreamChannel {
	name: string
	type:
		| 'container_stats'
		| 'host_metrics'
		| 'container_list'
		| 'container_logs'
		| 'docker_events'
		| 'all_stats'
	description: string
	defaultInterval: number
	requiresHostId: boolean
	requiresContainerId: boolean
}
