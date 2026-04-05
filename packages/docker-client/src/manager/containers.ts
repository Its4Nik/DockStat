import type { DOCKER } from "@dockstat/typings"
import { truncate } from "@dockstat/utils"
import { DockerClientManagerCore } from "./core"

export class Containers extends DockerClientManagerCore {
  public async getAllContainers(clientId: number) {
    const allContainers =
      (await this.sendRequest<DOCKER.ContainerInfo[]>(clientId, {
        type: "getAllContainers",
      })) || []

    this.logger.info(`Received ${truncate(JSON.stringify(allContainers), 100)} containers`)
    return allContainers
  }

  public async getContainerCount(): Promise<{
    total: number
    perHost: Array<{ hostId: number; clientId: number; containerCount: number }>
  }> {
    this.logger.info("Getting container count")

    const clients = this.getAllClients()
    this.logger.debug(`Found ${clients.length} clients`)
    const perHost: Array<{ hostId: number; clientId: number; containerCount: number }> = []

    await Promise.all(
      clients.map(async ({ id: clientId }) => {
        try {
          const containers = await this.getAllContainers(clientId)
          // Group containers by hostId
          const hostCounts = new Map<number, number>()
          for (const container of containers) {
            const hostId = container.hostId
            hostCounts.set(hostId, (hostCounts.get(hostId) ?? 0) + 1)
          }
          // Add results for each host
          for (const [hostId, count] of hostCounts) {
            perHost.push({ hostId, clientId, containerCount: count })
          }
        } catch (error) {
          this.logger.error(`Failed to get containers for client ${clientId}: ${error}`)
        }
      })
    )

    const total = perHost.reduce((sum, h) => sum + h.containerCount, 0)

    this.logger.debug(
      `Returning container count across ${clients.length} clients: ${total} total, per-host: ${JSON.stringify(perHost)}`
    )

    return { total, perHost }
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

  public async getAllContainerStats(): Promise<DOCKER.ContainerStatsInfo[]> {
    const clients = this.getAllClients().filter((c) => c.initialized === true)

    const results = await Promise.all(
      clients.map((client) => this.getAllContainerStatsForClient(client.id))
    )

    return results.flat()
  }

  public async getAllContainerStatsForClient(
    clientId: number
  ): Promise<DOCKER.ContainerStatsInfo[]> {
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
    options?: {
      stdout?: boolean
      stderr?: boolean
      timestamps?: boolean
      tail?: number
      since?: string
      until?: string
    }
  ): Promise<string> {
    return this.sendRequest(clientId, {
      type: "getContainerLogs",
      hostId,
      containerId,
      options: options,
    })
  }

  public async execInContainer(
    clientId: number,
    hostId: number,
    containerId: string,
    command: string[],
    options?: DOCKER.ExecOptions
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
