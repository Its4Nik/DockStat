import Logger from "@dockstat/logger"
export const logger = new Logger("docker-client")

export type { ContainerStats, default as Dockerode } from "dockerode"
export { default, default as DockerClient } from "./src/docker-client"
export { default as HostHandler } from "./src/hosts-handler/index"
export { default as MonitoringManager } from "./src/monitoring/monitoring-manager"
export {
  STREAM_CHANNELS,
  StreamManager,
} from "./src/stream/stream-manager"
