import { DockerClientManagerCore } from "./core"

export class Images extends DockerClientManagerCore {
  public async getImages(clientId: number, hostId: number) {
    return this.sendRequest(clientId, {
      type: "getImages",
      hostId,
    })
  }

  public async pullImage(clientId: number, hostId: number, imageName: string): Promise<void> {
    return this.sendRequest(clientId, {
      type: "pullImage",
      hostId,
      imageName,
    })
  }
}
