import { retry } from "@dockstat/utils"
import type Dockerode from "dockerode"
import { DockerClientBase } from "../core/base"

/**
 * Volumes mixin: provides Docker volume operations.
 *
 * Intended to be composed with other mixins using applyMixins, with DockerClientBase as the base.
 */
export class Volumes extends DockerClientBase {
  /**
   * List volumes available on the specified host.
   */
  public async getVolumes(hostId: number): Promise<Dockerode.VolumeInspectInfo[]> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const res = await retry(() => docker.listVolumes(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    return res?.Volumes || []
  }
}

export default Volumes
