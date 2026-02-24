import { formatBytes, truncate } from "@dockstat/utils"
import Docker from "dockerode"
import { DOCKER_SOCKET_PATH } from "./consts"
import { DockNodeLogger } from "./utils/logger"

class Client {
  private logger = DockNodeLogger.spawn("Simple-Docker-Client")
  private d = new Docker({ socketPath: DOCKER_SOCKET_PATH })

  async getNetworkStats() {
    this.logger.info("Getting network Stats")

    const containers = await this.d.listContainers()

    const dat = await Promise.all(
      containers.map(async (c) => {
        const id = c.Id
        this.logger.debug(`Getting Stats for container: ${truncate(id, 10)}`)

        const stats = await this.d.getContainer(id).stats({ stream: false, "one-shot": true })

        const networks = stats.networks ?? {}
        const interfaces: Record<string, unknown> = {}

        for (const [iface, ethStats] of Object.entries(networks)) {
          this.logger.debug(`Formatting network bytes of ${truncate(id, 10)}[${iface}]`)
          interfaces[iface] = {
            ...ethStats,
            rx_bytes: formatBytes(ethStats.rx_bytes),
            tx_bytes: formatBytes(ethStats.tx_bytes),
          }
        }
        return {
          id,
          labels: c.Labels,
          name: c.Names,
          net: interfaces,
        }
      })
    )

    this.logger.info("Collected Network metrics")
    return dat
  }
}

export default new Client()
