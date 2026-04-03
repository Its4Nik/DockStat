import { BaseModule } from "./modules/base";
import { ContainerModule } from "./modules/container";
import { ImagesModule } from "./modules/images";
import type { ConnectionConfig } from "./modules/base/types";

export class Docker {
  public readonly containers: ContainerModule;
  public readonly images: ImagesModule;

  constructor(private config: ConnectionConfig) {
    this.containers = new ContainerModule(config);
    this.images = new ImagesModule(config);
  }

  async ping(): Promise<boolean> {
    const requester = new BaseModule(this.config);
    const res = await requester.request("/_ping", "GET");
    return res.ok;
  }
}
