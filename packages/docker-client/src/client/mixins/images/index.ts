import { retry } from "@dockstat/utils"
import type Dockerode from "dockerode"
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
  public async getImages(hostId: number): Promise<Dockerode.ImageInfo[]> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    return await retry(() => docker.listImages(), {
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
    const stream = await docker.pull(imageName)

    return new Promise((resolve, reject) => {
      docker.modem.followProgress(
        stream,
        (err: unknown) => {
          if (err) {
            reject(err instanceof Error ? err : new Error(String(err)))
          } else {
            resolve()
          }
        },
        // Optional progress handler: noop for now. Could emit events later.
        () => {}
      )
    })
  }
}

export default Images
