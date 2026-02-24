import { DockNodeLogger } from "./utils/logger"

export const DOCKER_BIN = Bun.env.DOCKER_BIN_PATH || "/usr/bin/docker"
export const DOCKER_SOCKET_PATH =
  Bun.env.DOCKER_SOCKET_PATH || Bun.env.DOCKER_HOST || "/var/run/docker.sock"

DockNodeLogger.debug(`Docker Bin: ${DOCKER_BIN}`)
DockNodeLogger.debug(`Docker Socket: ${DOCKER_SOCKET_PATH}`)
