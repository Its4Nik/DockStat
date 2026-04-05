import { BaseModule } from "../base"
import type { ListServicesRoute } from "./types"

export class ServicesModule extends BaseModule {
  async list(options: ListServicesRoute["parameters"]["query"]) {
    const res = await this.request("/services", "GET", undefined, undefined, options)
    return (await res.json()) as ListServicesRoute["responses"]["200"]["content"]["application/json"]
  }
}
