import { BaseModule } from "./modules/base";
import { ContainerModule } from "./modules/container";
import { ImagesModule } from "./modules/images";
import { NetworksModule } from "./modules/networks";
import type { ConnectionConfig } from "./modules/base/types";
import { VolumeModule } from "./modules/volumes";

export class Docker {
  public readonly containers: ContainerModule;
  public readonly images: ImagesModule;
  public readonly networks: NetworksModule;
  public readonly volumes: VolumeModule;

  constructor(private config: ConnectionConfig) {
    this.containers = new ContainerModule(config);
    this.images = new ImagesModule(config);
    this.networks = new NetworksModule(config);
    this.volumes = new VolumeModule(config)
  }

  async ping(): Promise<boolean> {
    const requester = new BaseModule(this.config);
    const res = await requester.request("/_ping", "GET");
    return res.ok;
  }
}
