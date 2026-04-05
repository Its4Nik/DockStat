import { DockerClientManagerCore } from "./core"

export class System extends DockerClientManagerCore {
  public async getSystemInfo(clientId: number, hostId: number) {
    return this.sendRequest(clientId, {
      hostId,
      type: "getSystemInfo",
    })
  }

  public async getSystemVersion(clientId: number, hostId: number) {
    return this.sendRequest(clientId, {
      hostId,
      type: "getSystemVersion",
    })
  }

  public async getDiskUsage(clientId: number, hostId: number) {
    return this.sendRequest(clientId, {
      hostId,
      type: "getDiskUsage",
    })
  }

  public async pruneSystem(clientId: number, hostId: number) {
    return this.sendRequest(clientId, {
      hostId,
      type: "pruneSystem",
    })
  }
}
