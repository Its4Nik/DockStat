import { BaseModule } from "./modules/base"
import type { ConnectionConfig } from "./modules/base/types"
import { ContainerModule } from "./modules/container"
import { DistributionModule } from "./modules/distribution"
import { ExecModule } from "./modules/exec"
import { ImagesModule } from "./modules/images"
import { NetworksModule } from "./modules/networks"
import { NodesModule } from "./modules/nodes"
import { VolumeModule } from "./modules/volumes"

export class Docker {
  public readonly containers: ContainerModule
  public readonly images: ImagesModule
  public readonly networks: NetworksModule
  public readonly volumes: VolumeModule
  public readonly exec: ExecModule
  public readonly distribution: DistributionModule
  public readonly nodes: NodesModule

  constructor(private config: ConnectionConfig) {
    this.containers = new ContainerModule(config)
    this.images = new ImagesModule(config)
    this.networks = new NetworksModule(config)
    this.volumes = new VolumeModule(config)
    this.exec = new ExecModule(config)
    this.distribution = new DistributionModule(config)
    this.nodes = new NodesModule(config)
  }

  async ping(): Promise<boolean> {
    const requester = new BaseModule(this.config)
    const res = await requester.request("/_ping", "GET")
    return res.ok
  }
}
