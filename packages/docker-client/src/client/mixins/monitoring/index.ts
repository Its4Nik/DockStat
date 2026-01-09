import { proxyEvent } from "../../../events/workerEventProxy"
import MonitoringManager from "../../managers/monitoring"
import { DockerClientBase } from "../core/base"

/**
 * Monitoring mixin: encapsulates lifecycle control for MonitoringManager and
 * delegates monitoring actions to it.
 *
 * Compose this with DockerClientBase via applyMixins alongside other mixins.
 */
export class Monitoring extends DockerClientBase {
  /**
   * Lazily create a MonitoringManager instance.
   * Throws if a manager already exists.
   */
  public createMonitoringManager(): void {
    this.checkDisposed()

    const existing = this.monitoringManager as MonitoringManager | undefined
    if (existing) {
      const error = new Error(`Monitoring already initialized on ${this.name}`)
      proxyEvent("error", error)
      throw error
    }

    this.monitoringManager = new MonitoringManager(
      this.logger,
      this.dockerInstances,
      this.hostHandler.getHosts(),
      this.options.monitoringOptions
    )
    this.logger.info("MonitoringManager created")
  }

  /**
   * Start monitoring. Requires a MonitoringManager to exist.
   */
  public startMonitoring(): void {
    this.checkDisposed()

    const mm = this.monitoringManager as MonitoringManager | undefined
    if (!mm) {
      const error = new Error(`Monitoring manager not initialized on ${this.name}`)
      proxyEvent("error", error)
      throw error
    }

    mm.startMonitoring()
    this.logger.info("Monitoring started")
  }

  /**
   * Stop monitoring. Requires a MonitoringManager to exist.
   */
  public stopMonitoring(): void {
    const mm = this.monitoringManager as MonitoringManager | undefined
    if (!mm) {
      const error = new Error(`Monitoring manager not initialized on ${this.name}`)
      proxyEvent("error", error)
      throw error
    }

    mm.stopMonitoring()
    this.logger.info("Monitoring stopped")
  }

  /**
   * Returns whether monitoring is currently active.
   * Requires a MonitoringManager to exist.
   */
  public isMonitoring(): boolean {
    const mm = this.monitoringManager as MonitoringManager | undefined
    if (!mm) {
      const error = new Error(`Monitoring manager not initialized on ${this.name}`)
      proxyEvent("error", error)
      throw error
    }

    const state = mm.getMonitoringState().isMonitoring ?? false
    this.logger.debug(state ? `${this.name} is monitoring` : `${this.name} is not monitoring`)
    return state
  }

  /**
   * Whether a MonitoringManager exists for this client.
   */
  public hasMonitoringManager(): boolean {
    return (this.monitoringManager as MonitoringManager | undefined) !== undefined
  }

  /**
   * Expose MonitoringManager state (for diagnostics/telemetry).
   * Requires a MonitoringManager to exist.
   */
  public getMonitoringState() {
    const mm = this.monitoringManager as MonitoringManager | undefined
    if (!mm) {
      const error = new Error(`Monitoring manager not initialized on ${this.name}`)
      proxyEvent("error", error)
      throw error
    }
    return mm.getMonitoringState()
  }
}

export default Monitoring
