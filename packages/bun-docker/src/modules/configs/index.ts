import { BaseModule } from "../base"
import type {
  ConfigCreateRoute,
  ConfigInspectRoute,
  ConfigListRoute,
  ConfigUpdateRoute,
} from "./types"

// Type aliases for better readability using route type aliases
type ConfigListQuery = ConfigListRoute["parameters"]["query"]
type ConfigListResponse = ConfigListRoute["responses"]["200"]["content"]["application/json"]
type ConfigCreateBody = NonNullable<ConfigCreateRoute["requestBody"]>["content"]["application/json"]
type ConfigCreateResponse = ConfigCreateRoute["responses"]["201"]["content"]["application/json"]
type ConfigInspectResponse = ConfigInspectRoute["responses"]["200"]["content"]["application/json"]
type ConfigUpdateBody = NonNullable<ConfigUpdateRoute["requestBody"]>["content"]["application/json"]

export class ConfigsModule extends BaseModule {
  async list(options?: ConfigListQuery): Promise<ConfigListResponse> {
    const res = await this.request("/configs", "GET", undefined, undefined, options)
    return (await res.json()) as ConfigListResponse
  }

  async create(config: ConfigCreateBody): Promise<ConfigCreateResponse> {
    const res = await this.request("/configs/create", "POST", config)
    return (await res.json()) as ConfigCreateResponse
  }

  async inspect(id: string): Promise<ConfigInspectResponse> {
    const path = `/configs/${id}`
    const res = await this.request(path, "GET")
    return (await res.json()) as ConfigInspectResponse
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
  async update(id: string, version: number, config: ConfigUpdateBody): Promise<void> {
    const path = `/configs/${id}/update`
    await this.request(path, "POST", config, undefined, { version })
  }
}
