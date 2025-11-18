import Logger from '@dockstat/logger'
export const logger = new Logger('docker-client')

export { default } from './src/docker-client'
export { default as DockerClient } from './src/docker-client'
export { default as HostHandler } from './src/hosts-handler/index'
export { DockerEventEmitter } from './src/events/docker-events'
export { default as MonitoringManager } from './src/monitoring/monitoring-manager'
export {
	StreamManager,
	STREAM_CHANNELS,
} from './src/stream/stream-manager'

export type { ContainerStats } from 'dockerode'
export type { default as Dockerode } from 'dockerode'
