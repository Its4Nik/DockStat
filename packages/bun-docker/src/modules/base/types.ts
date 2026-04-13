import type { TLSOptions } from "bun"
import type { LoggerConfig } from "../../utils/logger"

/**
 * Connection mode for communicating with the Docker daemon.
 * - `"unix"` — Communicate via a Unix domain socket (default on Linux/macOS).
 * - `"tcp"` — Communicate via TCP (HTTP/HTTPS).
 * - `"npipe"` — Communicate via a Windows named pipe (reserved for future Windows support).
 */
export type ConnectionMode = "unix" | "tcp" | "npipe"

/**
 * Configuration for connecting to the Docker daemon.
 *
 * Typically obtained via `getConnectionConfig()` from `@dockstat/docker/utils/env`,
 * but can also be constructed manually for custom setups.
 */
export interface ConnectionConfig {
  /** The connection mode (unix, tcp, or npipe). */
  mode: ConnectionMode

  /**
   * For Unix mode: the file path to the Docker daemon socket.
   * Defaults to `DEFAULT_SOCKET_PATH` (`/var/run/docker.sock`).
   */
  socketPath?: string

  /**
   * For TCP mode: the full base URL (e.g., `http://192.168.1.50:2375`).
   * When TLS is configured, this should use `https://`.
   */
  baseUrl?: string

  /**
   * TLS options for securing the connection.
   * Used for TCP mode or TLS-secured Unix sockets.
   */
  tls?: TLSOptions

  /**
   * The Docker Engine API version to use (e.g., `"1.54"`).
   * Defaults to `DEFAULT_API_VERSION` if not specified.
   */
  dockerAPIVersion?: string

  /**
   * Request timeout in milliseconds.
   * Defaults to `DEFAULT_TIMEOUT` (30,000ms) if not specified.
   */
  timeout?: number

  /**
   * Logger configuration for request/response logging.
   * Can be a `LoggerConfig` object or `true` to enable with defaults.
   */
  logger?: LoggerConfig | boolean
}

/**
 * Supported HTTP methods for Docker API requests.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD"
