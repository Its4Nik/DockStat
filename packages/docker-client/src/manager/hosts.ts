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
    let hosts: Array<{
      name: string
      id: number
      clientId: number
      reachable: boolean
    }> = []

    for (const client of clients) {
      const pRes = await this.ping(client.id)

      const clientsHosts = (await this.getHosts(client.id)).map((c) => ({
        name: c.name,
        id: Number(c.id),
        clientId: Number(client.id),
        reachable: pRes.reachableInstances.includes(Number(c.id)),
      }))
      this.logger.debug(`Clients Hosts: ${JSON.stringify(clientsHosts)}`)
      hosts = hosts.concat(clientsHosts)
    }

    this.logger.debug(`All Hosts: ${JSON.stringify(hosts)}`)
    return hosts
  }

  public async ping(clientId: number) {
    return this.sendRequest<{
      reachableInstances: number[]
      unreachableInstances: number[]
    }>(clientId, { type: "ping" })
  }
}
