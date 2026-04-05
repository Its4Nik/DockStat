/**
 * Docker Socket Connection Utilities
 *
 * Provides functions for connecting to Docker via socket or TCP.
 */

import type { DockerConnectionOptions } from "../types"

/**
 * Default Docker socket path
 */
export const DEFAULT_SOCKET_PATH = "/var/run/docker.sock"

/**
 * Default Docker host
 */
export const DEFAULT_HOST = "http://localhost"

/**
 * Default request timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 30000

/**
 * Build connection configuration for Docker
 */
export function buildConnectionConfig(options: DockerConnectionOptions = {}): {
  socketPath?: string
  host?: string
  timeout: number
} {
  const config: {
    socketPath?: string
    host?: string
    timeout: number
  } = {
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
  }

  // Prioritize socket path over host
  if (options.socketPath) {
    config.socketPath = options.socketPath
  } else if (options.host) {
    config.host = options.host
  } else {
    // Default to socket if available, otherwise localhost
    config.socketPath = DEFAULT_SOCKET_PATH
  }

  return config
}

/**
 * Check if Docker socket is available
 */
export async function isSocketAvailable(
  socketPath: string = DEFAULT_SOCKET_PATH
): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      unix: socketPath,
      socket: {
        data() {},
        error() {},
        open() {},
        close() {},
      },
    })
    socket.end()
    return true
  } catch {
    return false
  }
}

/**
 * Build Docker API URL
 */
export function buildApiUrl(path: string, host?: string): string {
  const baseUrl = host ?? DEFAULT_HOST
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

/**
 * Parse Docker version string to object
 */
export function parseDockerVersion(version: string): {
  major: number
  minor: number
  patch: number
  build?: string
} | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)
  if (!match?.[1] || !match[2] || !match[3]) {
    return null
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    build: match[4],
  }
}

/**
 * Compare Docker versions
 */
export function compareVersions(v1: string, v2: string): -1 | 0 | 1 {
  const parsed1 = parseDockerVersion(v1)
  const parsed2 = parseDockerVersion(v2)

  if (!parsed1 || !parsed2) {
    return 0
  }

  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1
  }

  return 0
}
