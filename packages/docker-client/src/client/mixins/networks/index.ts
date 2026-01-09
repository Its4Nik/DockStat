import { retry } from "@dockstat/utils"
import type Dockerode from "dockerode"
import { DockerClientBase } from "../core/base"

/**
 * Networks mixin: provides Docker network operations.
 *
 * Intended to be composed with other mixins using applyMixins, with DockerClientBase as the base.
 */
export class Networks extends DockerClientBase {
  /**
   * List networks available on the specified host.
   */
  public async getNetworks(hostId: number): Promise<Dockerode.NetworkInspectInfo[]> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    return await retry(() => docker.listNetworks(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }
}

export default Networks
