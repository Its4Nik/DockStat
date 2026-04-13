import { BaseModule } from "../base"
import type {
  ConfigCreateRoute,
  ConfigInspectRoute,
  ConfigListRoute,
  ConfigUpdateRoute,
} from "./types"

export class ConfigsModule extends BaseModule {
  async list(options?: ConfigListRoute["parameters"]["query"]) {
    const res = await this.request("/configs", "GET", undefined, undefined, options)
    return (await res.json()) as ConfigListRoute["responses"]["200"]["content"]["application/json"]
  }

  async create(
    config: NonNullable<ConfigCreateRoute["requestBody"]>["content"]["application/json"]
  ) {
    const res = await this.request("/configs/create", "POST", config)
    return (await res.json()) as ConfigCreateRoute["responses"]["201"]["content"]["application/json"]
  }

  async inspect(id: string) {
    const path = `/configs/${id}`
    const res = await this.request(path, "GET")
    return (await res.json()) as ConfigInspectRoute["responses"]["200"]["content"]["application/json"]
  }

  async delete(id: string): Promise<void> {
    const path = `/configs/${id}`
    await this.request(path, "DELETE")
  }

  /**
   * @param id The ID or name of the config
   * @param version The version number of the config object being updated. This is required to avoid conflicting writes.
   * @param config The spec of the config to update. Currently, only the Labels field can be updated. All other fields must remain unchanged from the ConfigInspect endpoint response values.
   */
  async update(
    id: string,
    version: number,
    config: NonNullable<ConfigUpdateRoute["requestBody"]>["content"]["application/json"]
  ): Promise<void> {
    const path = `/configs/${id}/update`
    await this.request(path, "POST", config, undefined, { version })
  }
}
