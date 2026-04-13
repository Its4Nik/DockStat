import { retry } from "@dockstat/utils"
import { DockerClientBase } from "../core/base"

/**
 * Images mixin: provides Docker image operations.
 *
 * Intended to be composed with other mixins using applyMixins, with DockerClientBase as the base.
 */
export class Images extends DockerClientBase {
  /**
   * List images available on the specified host.
   */
  public async getImages(hostId: number) {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    return await retry(() => docker.images.list(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  /**
   * Pull an image on the specified host.
   */
  public async pullImage(hostId: number, imageName: string): Promise<void> {
    this.checkDisposed()

    if (!imageName || typeof imageName !== "string") {
      throw new Error("imageName is required")
    }

    const docker = this.getDockerInstance(hostId)
    await docker.images.create(imageName)
  }
}

export default Images
