/**
 * Custom error class for Docker API errors.
 *
 * Thrown when the Docker Engine API returns a non-OK HTTP status code.
 * Contains the status code, request path, API version, and original parameters
 * for debugging and error handling.
 *
 * @example
 * ```ts
 * try {
 *   await docker.containers.inspect("nonexistent")
 * } catch (error) {
 *   if (error instanceof DockerError) {
 *     console.error(`API Error ${error.status}: ${error.message}`)
 *     console.error(`Path: ${error.path}, Version: ${error.version}`)
 *   }
 * }
 * ```
 */
export class DockerError extends Error {
  /** The HTTP status code returned by the Docker API. */
  readonly status: number

  /** The API endpoint path that was requested. */
  readonly path: string

  /** The Docker API version used for the request. */
  readonly version: string

  /** The query parameters or description of the request. */
  readonly params: object | string

  /**
   * Create a new DockerError.
   *
   * @param message - The error message (typically includes the status code and API error text).
   * @param status - The HTTP status code (e.g., 404, 500).
   * @param path - The API endpoint path (e.g., `/containers/json`).
   * @param version - The Docker API version (e.g., `1.54`).
   * @param params - The original request parameters, for debugging.
   */
  constructor(
    message: string,
    status: number,
    path: string,
    version: string,
    params: object | string
  ) {
    super(message)
    this.name = "DockerError"
    this.status = status
    this.path = path
    this.version = version
    this.params = params

    Object.setPrototypeOf(this, DockerError.prototype)
  }

  /**
   * Returns a formatted string representation of the error.
   *
   * @returns A string in the format: `DockerError: {message} [HTTP {status}] Path: {path} Version: {version}`
   */
  override toString(): string {
    return `DockerError: ${this.message} [HTTP ${this.status}] Path: ${this.path} Version: ${this.version}`
  }
}
