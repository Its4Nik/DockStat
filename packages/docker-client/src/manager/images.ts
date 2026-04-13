import { DockerClientManagerCore } from "./core"

export class Images extends DockerClientManagerCore {
  public async getImages(clientId: number, hostId: number) {
    return this.sendRequest(clientId, {
      hostId,
      type: "getImages",
    })
  }

  public async pullImage(clientId: number, hostId: number, imageName: string): Promise<void> {
    return this.sendRequest(clientId, {
      hostId,
      imageName,
      type: "pullImage",
    })
  }
}
