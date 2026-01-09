import type { DATABASE } from "@dockstat/typings"
import Dockerode from "dockerode"
import { proxyEvent } from "../../../events/workerEventProxy"
import { DockerClientBase } from "../core/base"

/**
 * Hosts mixin: handles host persistence (via HostHandler), Dockerode instance lifecycle,
 * initialization, and basic health checks (ping).
 *
 * This class is intended to be composed with other mixins using applyMixins,
 * with DockerClientBase as the foundation.
 */
export class Hosts extends DockerClientBase {
  /**
   * Initialize Docker instances for provided hosts or for all hosts found in DB.
   * - Validates that the client is not disposed
   * - Ensures each host has a Dockerode instance
   * - Emits events for errors
   */
  public init(hosts?: DATABASE.DB_target_host[]): void {
    this.checkDisposed()

    const initialHosts: DATABASE.DB_target_host[] =
      Array.isArray(hosts) && hosts.length > 0 ? hosts : this.hostHandler.getHosts()

    this.logger.info(`Initializing Docker instances for ${initialHosts.length} host(s)`)
    for (const host of initialHosts) {
      try {
        this.addHost(host)
      } catch (error) {
        proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
          hostId: Number(host?.id ?? -1),
          message: "Failed to initialize host",
        })
      }
    }
  }

  /**
   * Add a host (persist to DB if needed), create a Dockerode instance and attach it.
   * Emits "host:added" event on success.
   */
  public addHost(host: DATABASE.DB_target_host): DATABASE.DB_target_host {
    this.checkDisposed()

    // Validate host configuration
    if (!host || typeof host !== "object") {
      throw new Error("Host configuration is required")
    }
    if (!host.name || typeof host.name !== "string" || host.name.trim().length === 0) {
      throw new Error("Host name is required and must be a non-empty string")
    }
    if (!host.host || typeof host.host !== "string" || host.host.trim().length === 0) {
      throw new Error("Host address is required and must be a non-empty string")
    }
    if (typeof host.port !== "number" || host.port < 1 || host.port > 65535) {
      throw new Error(`Invalid port: ${host.port}. Must be between 1 and 65535`)
    }

    // Insert to DB if it's a new host (no ID)
    if (!Number(host.id)) {
      this.logger.info(`Adding new host: ${host.name}`)
      host.id = this.hostHandler.addHost(host)
    } else {
      this.logger.info(`Host ${host.name} (${Number(host.id)}) already exists. Initializing...`)
    }

    const instanceCfg: Dockerode.DockerOptions = {
      host: host.host,
      protocol: host.secure ? "https" : "http",
      port: host.port,
      timeout: this.options.defaultTimeout,
    }

    this.logger.info(`Creating Docker instance: ${JSON.stringify(instanceCfg)}`)
    try {
      const dockerInstance = new Dockerode(instanceCfg)
      const hostId = Number(host.id)

      // Store Dockerode instance
      this.dockerInstances.set(hostId, dockerInstance)

      // If a monitoring manager is present, refresh its view
      if (this.monitoringManager && typeof this.monitoringManager.updateHosts === "function") {
        this.monitoringManager.updateHosts(this.hostHandler.getHosts())
      }
      if (
        this.monitoringManager &&
        typeof this.monitoringManager.updateDockerInstances === "function"
      ) {
        this.monitoringManager.updateDockerInstances(this.dockerInstances)
      }

      // Emit event
      proxyEvent("host:added", {
        hostId,
        docker_client_id: Number(host.docker_client_id ?? 0),
        hostName: String(host.name),
      })

      return host as DATABASE.DB_target_host
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to create Docker instance for host ${host.name}: ${errMsg}`)
      throw new Error(`Failed to create Docker instance: ${errMsg}`, { cause: error as Error })
    }
  }

  /**
   * Remove a host and its Docker instance.
   * Stops any active interval-based streams tied to the host.
   * Emits "host:removed" event on success.
   */
  public removeHost(hostId: number): void {
    this.checkDisposed()

    if (typeof hostId !== "number" || hostId < 0) {
      throw new Error(`Invalid host ID: ${hostId}. Must be a non-negative number.`)
    }

    // If no instance is present, proceed to ensure DB cleanup
    if (!this.dockerInstances.has(hostId)) {
      this.logger.warn(`No Docker instance found for host ID ${hostId}`)
    }

    this.logger.info(`Removing host with ID: ${hostId}`)

    try {
      // Stop interval-based streams linked to this host (best-effort)
      const streamsToRemove: string[] = []
      for (const key of Array.from(this.activeStreams.keys())) {
        if (
          key.includes(`-${hostId}-`) ||
          key.includes(`host-${hostId}`) ||
          key.startsWith(`${hostId}-`)
        ) {
          streamsToRemove.push(key)
        }
      }
      for (const streamKey of streamsToRemove) {
        const timer = this.activeStreams.get(streamKey)
        if (timer) {
          clearInterval(timer)
          this.activeStreams.delete(streamKey)
          this.logger.debug(`Stopped stream: ${streamKey}`)
        }
      }

      // Remove runtime instance and DB record
      this.dockerInstances.delete(hostId)
      this.hostHandler.removeHost(hostId)

      // Update monitoring view if present
      if (this.monitoringManager && typeof this.monitoringManager.updateHosts === "function") {
        this.monitoringManager.updateHosts(this.hostHandler.getHosts())
      }
      if (
        this.monitoringManager &&
        typeof this.monitoringManager.updateDockerInstances === "function"
      ) {
        this.monitoringManager.updateDockerInstances(this.dockerInstances)
      }

      proxyEvent("host:removed", { hostId: hostId })
      this.logger.info(`Successfully removed host with ID: ${hostId}`)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to remove host ${hostId}: ${errMsg}`)
      throw new Error(`Failed to remove host: ${errMsg}`, { cause: error as Error })
    }
  }

  /**
   * Update a host configuration and rebuild its Docker instance if necessary.
   * Emits "host:updated" event on success.
   */
  public updateHost(host: DATABASE.DB_target_host): void {
    this.checkDisposed()

    if (!host || typeof host !== "object") {
      throw new Error("Host configuration is required")
    }
    if (!host.id || typeof host.id !== "number") {
      throw new Error("Host ID is required for updates")
    }

    const hostId = Number(host.id)
    this.logger.info(`Updating host ${host.name} (ID: ${hostId})`)

    try {
      // Stop interval-based streams for this host
      const streamsToRemove: string[] = []
      for (const key of Array.from(this.activeStreams.keys())) {
        if (
          key.includes(`-${hostId}-`) ||
          key.includes(`host-${hostId}`) ||
          key.startsWith(`${hostId}-`)
        ) {
          streamsToRemove.push(key)
        }
      }
      for (const streamKey of streamsToRemove) {
        const timer = this.activeStreams.get(streamKey)
        if (timer) {
          clearInterval(timer)
          this.activeStreams.delete(streamKey)
          this.logger.debug(`Stopped stream: ${streamKey}`)
        }
      }

      // Remove old instance if present
      this.dockerInstances.delete(hostId)

      // Update DB record first
      this.hostHandler.updateHost(host)

      // Recreate Docker instance
      const instanceCfg: Dockerode.DockerOptions = {
        host: host.host,
        protocol: host.secure ? "https" : "http",
        port: host.port,
        timeout: this.options.defaultTimeout,
      }
      this.logger.info(`Creating new Docker instance: ${JSON.stringify(instanceCfg)}`)

      const dockerInstance = new Dockerode(instanceCfg)
      this.dockerInstances.set(hostId, dockerInstance)

      // Update monitoring manager if present
      if (this.monitoringManager && typeof this.monitoringManager.updateHosts === "function") {
        this.monitoringManager.updateHosts(this.hostHandler.getHosts())
      }
      if (
        this.monitoringManager &&
        typeof this.monitoringManager.updateDockerInstances === "function"
      ) {
        this.monitoringManager.updateDockerInstances(this.dockerInstances)
      }

      proxyEvent("host:updated", {
        hostId,
        hostName: String(host.name),
      })

      this.logger.info(`Successfully updated host ${host.name} (ID: ${hostId})`)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to update host ${hostId}: ${errMsg}`)
      throw new Error(`Failed to update host: ${errMsg}`, { cause: error as Error })
    }
  }

  /**
   * Get all hosts from the underlying HostHandler table.
   */
  public getHosts(): DATABASE.DB_target_host[] {
    this.checkDisposed()
    return this.hostHandler.getHosts()
  }

  /**
   * Ping all Docker instances for this client.
   * Returns arrays of reachable and unreachable host IDs.
   */
  public async ping(): Promise<{
    reachableInstances: number[]
    unreachableInstances: number[]
  }> {
    this.checkDisposed()
    this.logger.info("Pinging all Docker instances")

    const instances = Array.from(this.dockerInstances.entries())
    if (instances.length === 0) {
      this.logger.info("No Docker instances to ping")
      return { reachableInstances: [], unreachableInstances: [] }
    }

    const results = await Promise.all(
      instances.map(async ([id, docker]) => {
        try {
          this.logger.debug(`Pinging: ID:${id}`)
          await docker.ping()
          return { id, ok: true as const }
        } catch (err) {
          const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
          this.logger.warn(`Ping failed for instance ${id}: ${msg}`)
          return { id, ok: false as const, error: msg }
        }
      })
    )

    const reachableInstances: number[] = []
    const unreachableInstances: number[] = []

    for (const r of results) {
      if (r.ok) {
        reachableInstances.push(r.id)
      } else {
        unreachableInstances.push(r.id)
        if (r.error) this.logger.error(`Instance ${r.id} unreachable: ${r.error}`)
      }
    }

    this.logger.info(
      `Ping complete: ${reachableInstances.length} healthy, ${unreachableInstances.length} unhealthy`
    )
    if (unreachableInstances.length > 0) {
      this.logger.warn(`Unreachable instances: [${unreachableInstances.join(", ")}]`)
    }

    return { reachableInstances, unreachableInstances }
  }

  /**
   * Drop the host table for this client.
   * Intended for teardown/cleanup operations.
   */
  public deleteTable() {
    this.checkDisposed()
    return this.hostHandler.deleteTable()
  }
}

export default Hosts
