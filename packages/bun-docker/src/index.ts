import { Docker } from "./docker"
import { getConnectionConfig } from "./utils/env"
import { DockerError } from "./utils/error"
import { DockerLogger } from "./utils/logger"

/**
 * Create a Docker client instance configured from environment variables.
 *
 * Reads the following environment variables to configure the connection:
 * - `DOCKER_HOST` — Docker daemon URL (preferred; supports `unix://`, `tcp://`, `http://` formats)
 * - `DOCKER_SOCKET` — Legacy socket path (backward compatible; same format support)
 * - `DOCKER_TIMEOUT` — Request timeout in milliseconds (default: 30000)
 * - `DOCKER_API_VERSION` — Docker API version (default: `"1.54"`)
 * - `DOCKER_CLIENT_LOG_LEVEL` — Enable logging with level (`debug`, `info`, `warn`, `error`)
 * - `CERT_FILE`, `KEY_FILE`, `CA_FILE` — TLS certificate paths
 *
 * If neither `DOCKER_HOST` nor `DOCKER_SOCKET` is set, defaults to connecting
 * via Unix socket at `/var/run/docker.sock`.
 *
 * @returns A configured `Docker` client instance.
 *
 * @example
 * ```ts
 * import { createDockerFromEnv } from "@dockstat/docker"
 *
 * // Uses DOCKER_HOST or DOCKER_SOCKET env vars (or defaults)
 * const docker = createDockerFromEnv()
 *
 * const containers = await docker.containers.list({ all: true })
 * ```
 */
export const createDockerFromEnv = () => {
  const config = getConnectionConfig()
  return new Docker(config)
}

export { Docker, DockerError, DockerLogger }
export type { ConnectionConfig, ConnectionMode, HttpMethod } from "./modules/base/types"
export {
  DEFAULT_API_VERSION,
  DEFAULT_SOCKET_PATH,
  DEFAULT_TIMEOUT,
  isSocketAvailable,
  parseDockerHost,
} from "./utils/env"
export type { LoggerConfig, LogLevel } from "./utils/logger"
