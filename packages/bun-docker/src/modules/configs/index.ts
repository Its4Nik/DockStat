import { BaseModule } from "../base"
import type { Config, ConfigResponse, ListConfigsOptions } from "./types"

export class ConfigsModule extends BaseModule {
  async list(options: ListConfigsOptions) {
    const res = await this.request("/configs", "GET", undefined, undefined, options)
    return (await res.json()) as ConfigResponse[]
  }

  async create(config: Config) {
    const res = await this.request("/configs/create", "POST", config)
    return (await res.json()) as { Id: string }
  }

  async inspect(id: string) {
    const path = `/configs/${id}`
    const res = await this.request(path, "GET")
    return (await res.json()) as ConfigResponse
  }

  async delete(id: string) {
    const path = `/configs/${id}`
    await this.request(path, "DELETE")
    return true
  }

  /**
   * @param id The ID or name of the config
   * @param version The version number of the config object being updated. This is required to avoid conflicting writes.
   * @param config The spec of the config to update. Currently, only the Labels field can be updated. All other fields must remain unchanged from the ConfigInspect endpoint response values.
   */
  async update(id: string, version: number, config: Config) {
    const path = `/configs/${id}/update`
    await this.request(path, "POST", config, undefined, { version: version })
    return true
  }
}
