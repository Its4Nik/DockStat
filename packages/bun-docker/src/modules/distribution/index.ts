import { BaseModule } from "../base"
import type { DistributionRoute } from "./types"

export class DistributionModule extends BaseModule {
  /**
   * Return image digest and platform information by contacting the registry.
   * @param image Image name or id
   */
  async getImageInfo(image: string) {
    const path = `/distribution/${image}/json`
    const res = await this.request(path, "GET")
    return (await res.json()) as DistributionRoute["responses"]["200"]["content"]["application/json"]
  }
}
