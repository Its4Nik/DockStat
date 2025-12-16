import type { DOCKER } from "@dockstat/typings"
import { DockerClientManagerCore } from "./core"

export class Containers extends DockerClientManagerCore {
  public async getAllContainers(clientId: number): Promise<DOCKER.ContainerInfo[]> {
    return this.sendRequest(clientId, { type: "getAllContainers" })
  }

  public async getContainersForHost(
    clientId: number,
    hostId: number
  ): Promise<DOCKER.ContainerInfo[]> {
    return this.sendRequest(clientId, {
      type: "getContainersForHost",
      hostId,
    })
  }

  public async getContainer(
    clientId: number,
    hostId: number,
    containerId: string
  ): Promise<DOCKER.ContainerInfo> {
    return this.sendRequest(clientId, {
      type: "getContainer",
      hostId,
      containerId,
    })
  }

  // Stats

  public async getAllContainerStats(clientId: number): Promise<DOCKER.ContainerStatsInfo[]> {
    return this.sendRequest(clientId, {
      type: "getAllContainerStats",
    })
  }

  public async getContainerStatsForHost(
    clientId: number,
    hostId: number
  ): Promise<DOCKER.ContainerStatsInfo[]> {
    return this.sendRequest(clientId, {
      type: "getContainerStatsForHost",
      hostId,
    })
  }

  public async getContainerStats(
    clientId: number,
    hostId: number,
    containerId: string
  ): Promise<DOCKER.ContainerStatsInfo> {
    return this.sendRequest(clientId, {
      type: "getContainerStats",
      hostId,
      containerId,
    })
  }

  // Control

  public async startContainer(
    clientId: number,
    hostId: number,
    containerId: string
  ): Promise<void> {
    return this.sendRequest(clientId, {
      type: "startContainer",
      hostId,
      containerId,
    })
  }

  public async stopContainer(clientId: number, hostId: number, containerId: string): Promise<void> {
    return this.sendRequest(clientId, {
      type: "stopContainer",
      hostId,
      containerId,
    })
  }

  public async restartContainer(
    clientId: number,
    hostId: number,
    containerId: string
  ): Promise<void> {
    return this.sendRequest(clientId, {
      type: "restartContainer",
      hostId,
      containerId,
    })
  }

  public async removeContainer(
    clientId: number,
    hostId: number,
    containerId: string,
    force?: boolean
  ): Promise<void> {
    return this.sendRequest(clientId, {
      type: "removeContainer",
      hostId,
      containerId,
      force,
    })
  }

  public async pauseContainer(
    clientId: number,
    hostId: number,
    containerId: string
  ): Promise<void> {
    return this.sendRequest(clientId, {
      type: "pauseContainer",
      hostId,
      containerId,
    })
  }

  public async unpauseContainer(
    clientId: number,
    hostId: number,
    containerId: string
  ): Promise<void> {
    return this.sendRequest(clientId, {
      type: "unpauseContainer",
      hostId,
      containerId,
    })
  }

  public async killContainer(
    clientId: number,
    hostId: number,
    containerId: string,
    signal?: string
  ): Promise<void> {
    return this.sendRequest(clientId, {
      type: "killContainer",
      hostId,
      containerId,
      signal,
    })
  }

  public async renameContainer(
    clientId: number,
    hostId: number,
    containerId: string,
    newName: string
  ): Promise<void> {
    return this.sendRequest(clientId, {
      type: "renameContainer",
      hostId,
      containerId,
      newName,
    })
  }

  public async getContainerLogs(
    clientId: number,
    hostId: number,
    containerId: string,
    options?: unknown
  ): Promise<string> {
    return this.sendRequest(clientId, {
      type: "getContainerLogs",
      hostId,
      containerId,
      options,
    })
  }

  public async execInContainer(
    clientId: number,
    hostId: number,
    containerId: string,
    command: string[],
    options?: unknown
  ): Promise<{
    stdout: string
    stderr: string
    exitCode: number
  }> {
    return this.sendRequest(clientId, {
      type: "execInContainer",
      hostId,
      containerId,
      command,
      options,
    })
  }
}
