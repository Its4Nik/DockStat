import { BaseModule } from "../base"
import type {
  CreatePluginRoute,
  DeletePluginRoute,
  DisablePluginRoute,
  EnablePluginRoute,
  InspectPluginRoute,
  ListPluginsRoute,
  PluginPrivlegesRoute,
  PullPluginRoute,
  SetPluginRoute,
  UpgradePluginRoute,
} from "./types"

export class PluginsModule extends BaseModule {
  /**
   * List plugins
   * @param options - List options
   * @returns Array of plugin configurations
   */
  async list(options?: ListPluginsRoute["parameters"]["query"]) {
    const res = await this.request(`/plugins`, "GET", undefined, undefined, options)
    return (await res.json()) as ListPluginsRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Get plugin privileges
   * @param options - Options with remote plugin name
   * @returns Array of plugin privileges
   */
  async privileges(options: PluginPrivlegesRoute["parameters"]["query"]) {
    const res = await this.request(`/plugins/privileges`, "GET", undefined, undefined, options)
    return (await res.json()) as PluginPrivlegesRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Pull a plugin
   * @param options - Pull options including remote, name, privileges, and auth
   * @returns Plugin configuration
   */
  async pull(
    plugins?: NonNullable<PullPluginRoute["requestBody"]>["content"]["application/json"],
    options?: PullPluginRoute["parameters"]["query"] & PullPluginRoute["parameters"]["header"]
  ) {
    const header = options?.["X-Registry-Auth"]
      ? { "X-Registry-Auth": options["X-Registry-Auth"] }
      : undefined
    const res = await this.request(`/plugins/pull`, "POST", plugins, header, options)
    return (await res.json()) as PullPluginRoute["responses"]["204"]["content"]
  }

  /**
   * Get plugin details
   * @param name - Plugin name
   * @returns Plugin configuration
   */
  async inspect(name: string, options?: InspectPluginRoute["parameters"]["query"]) {
    const res = await this.request(`/plugins/${name}/json`, "GET", undefined, undefined, options)
    return (await res.json()) as InspectPluginRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Remove a plugin
   * @param name - Plugin name
   * @param options - Remove options
   */
  async remove(name: string, options?: DeletePluginRoute["parameters"]["query"]) {
    const res = await this.request(`/plugins/${name}`, "DELETE", undefined, undefined, options)
    return (await res.json()) as DeletePluginRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Enable a plugin
   * @param name - Plugin name
   * @param options - Enable options
   */
  async enable(name: string, options?: EnablePluginRoute["parameters"]["query"]) {
    await this.request(`/plugins/${name}/enable`, "POST", undefined, undefined, options)
  }

  /**
   * Disable a plugin
   * @param name - Plugin name
   * @param options - Disable options
   */
  async disable(name: string, options?: DisablePluginRoute["parameters"]["query"]) {
    await this.request(`/plugins/${name}/disable`, "POST", undefined, undefined, options)
  }

  /**
   * Upgrade a plugin
   * @param name - Plugin name
   * @param options - Upgrade options
   * @returns Plugin configuration
   */
  async upgrade(
    name: string,
    plugin: NonNullable<UpgradePluginRoute["requestBody"]>["content"]["application/json"],
    options: UpgradePluginRoute["parameters"]["query"] & UpgradePluginRoute["parameters"]["header"]
  ) {
    const headers: Record<string, string> | undefined = options["X-Registry-Auth"]
      ? { "X-Registry-Auth": options["X-Registry-Auth"] }
      : undefined

    const res = await this.request(`/plugins/${name}/upgrade`, "POST", plugin, headers, options)
    return (await res.json()) as UpgradePluginRoute["responses"]["204"]["content"]
  }

  /**
   * Create a plugin
   * @param options - Create options
   * @returns Plugin configuration
   */
  async create(
    plugin: NonNullable<CreatePluginRoute["requestBody"]>["content"]["application/x-tar"],
    options: CreatePluginRoute["parameters"]["query"]
  ) {
    const res = await this.request(`/plugins/create`, "POST", plugin, undefined, options)
    return (await res.json()) as CreatePluginRoute["responses"]["204"]["content"]
  }

  /**
   * Push a plugin
   * @param name - Plugin name
   */
  async push(name: string): Promise<void> {
    await this.request(`/plugins/${name}/push`, "POST")
  }

  /**
   * Set plugin settings
   * @param name - Plugin name
   * @param options - Set options
   */
  async set(
    name: string,
    options: NonNullable<SetPluginRoute["requestBody"]>["content"]["application/json"]
  ): Promise<void> {
    await this.request(`/plugins/${name}/set`, "POST", options)
  }
}
