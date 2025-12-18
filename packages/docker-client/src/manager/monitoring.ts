import type { DOCKER } from "@dockstat/typings"
import { DockerClientManagerCore } from "./core"

export class Monitoring extends DockerClientManagerCore {
  public async startMonitoring(clientId: number): Promise<void> {
    return this.sendRequest(clientId, { type: "startMonitoring" })
  }

  public async stopMonitoring(clientId: number): Promise<void> {
    return this.sendRequest(clientId, { type: "stopMonitoring" })
  }

  public async isMonitoring(clientId: number): Promise<boolean> {
    const res = await this.sendRequest(clientId, { type: "isMonitoring" })

    return res === true
  }

  public async getAllHostMetrics(clientId: number): Promise<DOCKER.HostMetrics[]> {
    return this.sendRequest(clientId, {
      type: "getAllHostMetrics",
    })
  }

  public async getHostMetrics(clientId: number, hostId: number): Promise<DOCKER.HostMetrics> {
    return this.sendRequest(clientId, {
      type: "getHostMetrics",
      hostId,
    })
  }

  public async getAllStats(clientId: number): Promise<DOCKER.AllStatsResponse> {
    return this.sendRequest(clientId, {
      type: "getAllStats",
    })
  }

  public async checkHostHealth(clientId: number, hostId: number): Promise<boolean> {
    return this.sendRequest(clientId, {
      type: "checkHostHealth",
      hostId,
    })
  }

  public async checkAllHostsHealth(clientId: number): Promise<Record<number, boolean>> {
    return this.sendRequest(clientId, {
      type: "checkAllHostsHealth",
    })
  }

  public async createMonitoringManager(clientId: number) {
    return this.sendRequest(clientId, {
      type: "createMonitoringManager",
    })
  }
}
