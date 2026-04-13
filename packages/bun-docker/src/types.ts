/**
 * Health check configuration for Docker containers.
 *
 * Defines how Docker should monitor the health of a container.
 * Based on the Docker Engine API v1.54 specification.
 *
 * @see https://docs.docker.com/engine/api/v1.54/#tag/Container/operation/ContainerInspect
 */
export type HealthCheck = {
  /**
   * The test to perform. Possible values are:
   * - `[]` — Inherit healthcheck from image or parent image.
   * - `["NONE"]` — Disable healthcheck.
   * - `["CMD", args...]` — Exec arguments directly.
   * - `["CMD-SHELL", command]` — Run command with system's default shell.
   *
   * A non-zero exit code indicates a failed healthcheck:
   * - `0` — Healthy
   * - `1` — Unhealthy
   * - `2` — Reserved (treated as unhealthy)
   * - Other values — Error running probe
   */
  Test: string[]

  /**
   * The time to wait between checks in nanoseconds.
   * Must be `0` or at least `1000000` (1 ms). `0` means inherit.
   */
  Interval: number

  /**
   * The time to wait before considering the check to have hung, in nanoseconds.
   * Must be `0` or at least `1000000` (1 ms). `0` means inherit.
   */
  Timeout: number

  /**
   * The number of consecutive failures needed to consider a container as unhealthy.
   * `0` means inherit.
   */
  Retries: number

  /**
   * Start period for the container to initialize before starting health-retries
   * countdown, in nanoseconds.
   * Must be `0` or at least `1000000` (1 ms). `0` means inherit.
   */
  StartPeriod: number

  /**
   * The time to wait between checks in nanoseconds during the start period.
   * Must be `0` or at least `1000000` (1 ms). `0` means inherit.
   */
  StartInterval: number
}
