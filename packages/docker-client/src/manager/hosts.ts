import type { DATABASE } from "@dockstat/typings"
import { DockerClientManagerCore } from "./core"

export class Hosts extends DockerClientManagerCore {
  public async init(clientId: number, hosts?: DATABASE.DB_target_host[]): Promise<void> {
    const actualHosts = hosts ?? []
    return this.sendRequest(clientId, {
      type: "init",
      hosts: actualHosts,
    })
  }

  public async addHost(
    clientId: number,
    hostname: string,
    name: string,
    secure: boolean,
    port: number,
    id?: number
  ): Promise<DATABASE.DB_target_host> {
    const result = await this.sendRequest<DATABASE.DB_target_host>(clientId, {
      type: "addHost",
      data: {
        host: hostname,
        name,
        secure,
        port,
        id,
        docker_client_id: clientId,
      },
    })

    const wrapper = this.workers.get(clientId)

    if (wrapper && result.id) {
      this.logger.info("Wrapper and result.id found - adding hostId to wrapper")
      wrapper.hostIds.add(result.id)
      this.workers.set(clientId, wrapper)
    }

    return result
  }

  public async removeHost(clientId: number, hostId: number): Promise<void> {
    await this.sendRequest(clientId, {
      type: "removeHost",
      hostId,
    })

    const wrapper = this.workers.get(clientId)
    if (wrapper) {
      wrapper.hostIds.delete(hostId)
      this.workers.set(clientId, wrapper)
    }
  }

  private async fetchClientHostsSafely(client: { id: number; name: string }) {
    try {
      const [pRes, clientHosts] = await Promise.all([
        this.ping(client.id),
        this.getHosts(client.id),
      ])

      const mappedHosts = clientHosts.map((c) => ({
        name: c.name,
        id: Number(c.id),
        clientId: Number(client.id),
        reachable: pRes.reachableInstances.includes(Number(c.id)),
      }))

      this.logger.debug(`Clients Hosts for ${client.name}: ${JSON.stringify(mappedHosts)}`)

      return mappedHosts
    } catch (error) {
      this.logger.error(
        `Failed to get hosts for client ${client.id} (${client.name}): ${
          error instanceof Error ? error.message : String(error)
        }`
      )
      return []
    }
  }

  public async updateHost(clientId: number, host: DATABASE.DB_target_host): Promise<void> {
    return this.sendRequest(clientId, {
      type: "updateHost",
      host,
    })
  }

  public async getHosts(clientId: number): Promise<DATABASE.DB_target_host[]> {
    return this.sendRequest(clientId, { type: "getHosts" })
  }

  public async getAllHosts() {
    this.logger.debug("Getting all hosts")
    const clients = this.getAllClients()
    this.logger.debug(`Clients: ${JSON.stringify(clients)}`)

    try {
      const allClientHosts = await Promise.all(
        clients.map((client) => this.fetchClientHostsSafely(client))
      )
      const hosts = allClientHosts.flat()

      this.logger.debug(`All Hosts: ${JSON.stringify(hosts)}`)
      return hosts
    } catch (error) {
      this.logger.error(
        `Failed to get all hosts: ${error instanceof Error ? error.message : String(error)}`
      )
      throw new Error(
        `Failed to get all hosts: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  public async ping(clientId: number) {
    return this.sendRequest<{
      reachableInstances: number[]
      unreachableInstances: number[]
    }>(clientId, { type: "ping" })
  }
}
