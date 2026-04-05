import { BaseModule } from "./modules/base"
import type { ConnectionConfig } from "./modules/base/types"
import { ConfigsModule } from "./modules/configs"
import { ContainerModule } from "./modules/container"
import { DistributionModule } from "./modules/distribution"
import { ExecModule } from "./modules/exec"
import { ImagesModule } from "./modules/images"
import { NetworksModule } from "./modules/networks"
import { NodesModule } from "./modules/nodes"
import { ServicesModule } from "./modules/services"
import { VolumeModule } from "./modules/volumes"

export class Docker {
  /**
   * Create and manage containers.
   */
  public readonly containers: ContainerModule
  public readonly images: ImagesModule
  /**
   * Networks are user-defined networks that containers can be attached to.
   * See the [networking documentation](https://docs.docker.com/network/) for more information.
   */
  public readonly networks: NetworksModule
  /**
   * Create and manage persistent storage that can be attached to containers.
   */
  public readonly volumes: VolumeModule
  /**
   * Run new commands inside running containers.
   * Refer to the [command-line reference](https://docs.docker.com/engine/reference/commandline/exec/) for more information.
   * To exec a command in a container,
   * you first need to create an exec instance, then start it.
   * These two API endpoints are wrapped up in a single command-line command, docker exec.
   */
  public readonly exec: ExecModule
  public readonly distribution: DistributionModule
  /**
   * Nodes are instances of the Engine participating in a swarm.
   * Swarm mode must be enabled for these endpoints to work.
   */
  public readonly nodes: NodesModule
  /**
   * Configs are application configurations that can be used by services.
   * Swarm mode must be enabled for these endpoints to work.
   */
  public readonly configs: ConfigsModule
  /**
   * Services are the definitions of tasks to run on a swarm.
   * Swarm mode must be enabled for these endpoints to work.
   */
  public readonly services: ServicesModule

  constructor(private config: ConnectionConfig) {
    this.containers = new ContainerModule(config)
    this.images = new ImagesModule(config)
    this.networks = new NetworksModule(config)
    this.volumes = new VolumeModule(config)
    this.exec = new ExecModule(config)
    this.distribution = new DistributionModule(config)
    this.nodes = new NodesModule(config)
    this.configs = new ConfigsModule(config)
    this.services = new ServicesModule(config)
  }

  async ping(): Promise<boolean> {
    const requester = new BaseModule(this.config)
    const res = await requester.request("/_ping", "GET")
    return res.ok
  }
}
