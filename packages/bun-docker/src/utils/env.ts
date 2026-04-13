import { existsSync } from "node:fs"
import { env } from "node:process"
import type { ConnectionConfig, ConnectionMode } from "../modules/base/types"
import type { LoggerConfig } from "./logger"

/** Default path to the Docker daemon Unix socket. */
export const DEFAULT_SOCKET_PATH = "/var/run/docker.sock"

/** Default Docker Engine API version. */
export const DEFAULT_API_VERSION = "1.54"

/**
 * Load TLS configuration from environment variables.
 *
 * Reads `CERT_FILE`, `KEY_FILE`, and optionally `CA_FILE` from the environment.
 * Returns `undefined` if `CERT_FILE` and `KEY_FILE` are not both set.
 *
 * @returns TLS options for Bun's fetch, or `undefined` if no TLS certs are configured.
 */
export const loadTls = (): ConnectionConfig["tls"] => {
  const hasCerts = env.CERT_FILE && env.KEY_FILE
  if (!hasCerts) return undefined

  return {
    // biome-ignore lint: Needed for dts-bundle-generator
    ca: env["CA_FILE"] ? Bun.file(env["CA_FILE"]) : undefined,
    // biome-ignore lint: Needed for dts-bundle-generator
    cert: env["CERT_FILE"] ? Bun.file(env["CERT_FILE"]) : undefined,
    // biome-ignore lint: Needed for dts-bundle-generator
    key: env["KEY_FILE"] ? Bun.file(env["KEY_FILE"]) : undefined,
  }
}

/**
 * Check if a Unix domain socket is available by attempting to connect.
 *
 * Uses `Bun.connect` with the `unix` socket type to verify that the socket
 * exists and is accepting connections. The connection is immediately closed after
 * the check succeeds.
 *
 * @param path - The filesystem path to the Unix socket.
 * @returns `true` if the socket is available, `false` otherwise.
 */
export async function isSocketAvailable(path: string): Promise<boolean> {
  try {
    // Quick filesystem check first
    if (!existsSync(path)) {
      return false
    }

    const socket = await Bun.connect({
      socket: {
        close() {
          // Socket closed
        },
        data(_socket, _data) {
          // No data expected
        },
        error() {
          // Connection error
        },
        open(socket) {
          // Socket connected successfully; close immediately
          socket.end()
        },
      },
      unix: path,
    })
    socket.end()
    return true
  } catch {
    return false
  }
}

/**
 * Parse a Docker host string into its mode and address components.
 *
 * Supports the following formats:
 * - `unix:///path/to/docker.sock` — Unix socket mode
 * - `tcp://host:port` — TCP mode
 * - `http://host:port` — TCP mode (HTTP protocol, will be upgraded to HTTPS if TLS is configured)
 * - `/path/to/docker.sock` — Raw Unix socket path (no prefix)
 * - `host:port` — Raw TCP host:port (no prefix)
 *
 * @param rawHost - The raw host string from `DOCKER_HOST` or `DOCKER_SOCKET`.
 * @returns An object with `mode` and the relevant address property.
 */
export function parseDockerHost(rawHost: string): {
  mode: ConnectionMode
  socketPath?: string
  baseUrl?: string
} {
  if (rawHost.startsWith("unix://")) {
    return {
      mode: "unix",
      socketPath: rawHost.replace("unix://", ""),
    }
  }

  if (
    rawHost.startsWith("tcp://") ||
    rawHost.startsWith("http://") ||
    rawHost.startsWith("https://")
  ) {
    // Strip the protocol; we'll add the correct one later based on TLS config
    const cleanHost = rawHost.replace(/^https?:\/\//, "").replace(/^tcp:\/\//, "")
    return {
      baseUrl: cleanHost,
      mode: "tcp",
    }
  }

  // Check if it looks like a TCP address (contains a colon with a port number)
  if (/^[\w.-]+:\d+$/.test(rawHost)) {
    return {
      baseUrl: rawHost,
      mode: "tcp",
    }
  }

  // Default to Unix socket path
  return {
    mode: "unix",
    socketPath: rawHost,
  }
}

/**
 * Build the full connection configuration from environment variables.
 *
 * Reads the following environment variables (in priority order):
 * 1. `DOCKER_HOST` — Standard Docker env var (preferred). Supports `unix://`, `tcp://`, `http://` formats.
 * 2. `DOCKER_SOCKET` — Legacy env var (for backward compatibility). Same format support.
 * 3. Falls back to `DEFAULT_SOCKET_PATH` (`/var/run/docker.sock`) if neither is set.
 *
 * Also reads:
 * - `DOCKER_API_VERSION` — Docker API version. Defaults to `DEFAULT_API_VERSION` (`1.54`).
 * - `DOCKER_CLIENT_LOG_LEVEL` — Logger level (`debug`, `info`, `warn`, `error`).
 * - `CERT_FILE`, `KEY_FILE`, `CA_FILE` — TLS certificate paths.
 *
 * @returns A fully resolved `ConnectionConfig` object.
 */
export const getConnectionConfig = (): ConnectionConfig => {
  const rawHost = env.DOCKER_HOST || env.DOCKER_SOCKET || DEFAULT_SOCKET_PATH
  const tls = loadTls()

  const parsed = parseDockerHost(rawHost)

  // Resolve API version
  const dockerAPIVersion = env.DOCKER_API_VERSION || DEFAULT_API_VERSION

  // Resolve logger config
  const logLevelEnv = env.DOCKER_CLIENT_LOG_LEVEL
  let logger: LoggerConfig | undefined
  if (logLevelEnv && ["debug", "info", "warn", "error"].includes(logLevelEnv)) {
    logger = {
      enabled: true,
      level: logLevelEnv as LoggerConfig["level"],
    }
  }

  if (parsed.mode === "unix") {
    return {
      dockerAPIVersion,
      logger,
      mode: "unix",
      socketPath: parsed.socketPath,
      tls,
    }
  }

  // TCP mode
  let protocol = "http://"
  if (tls) {
    protocol = "https://"
  }

  return {
    baseUrl: `${protocol}${parsed.baseUrl}`,
    dockerAPIVersion,
    logger,
    mode: "tcp",
    tls,
  }
}
