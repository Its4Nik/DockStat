import type { DOCKER } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import { DockerClientBase } from "../core/base"

/**
 * System mixin: provides Docker system/daemon operations.
 *
 * Intended to be composed with other mixins using applyMixins,
 * with DockerClientBase as the base.
 */
export class System extends DockerClientBase {
  /**
   * Get system information from the Docker daemon on the specified host.
   */
  public async getSystemInfo(hostId: number) {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    return await retry(() => docker.system.info(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  /**
   * Get Docker daemon version information on the specified host.
   */
  public async getSystemVersion(
    hostId: number
  ) {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    return await retry(() => docker.system.version(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  /**
   * Get disk usage information from the Docker daemon on the specified host.
   */
  public async getDiskUsage(hostId: number) {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    return await retry(() => docker.system.dataUsage(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  /**
   * Prune unused Docker images on the specified host.
   * Returns the reclaimed space in bytes.
   */
  public async pruneSystem(hostId: number) {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    return await retry(() => docker.images.prune(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }
}

export default System
