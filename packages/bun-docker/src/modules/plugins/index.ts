import { BaseModule } from "../base"
import type {
  CreatePluginOptions,
  DisablePluginOptions,
  EnablePluginOptions,
  ListPluginsOptions,
  PluginConfig,
  PluginPrivilege,
  PullPluginOptions,
  RemovePluginOptions,
  SetPluginOptions,
  UpgradePluginOptions,
} from "./types"

export class PluginsModule extends BaseModule {
  /**
   * List plugins
   * @param options - List options
   * @returns Array of plugin configurations
   */
  async list(options?: ListPluginsOptions): Promise<PluginConfig[]> {
    const res = await this.request(`/plugins`, "GET", undefined, undefined, options)
    return (await res.json()) as PluginConfig[]
  }

  /**
   * Get plugin privileges
   * @param remote - Remote name or plugin name
   * @returns Array of plugin privileges
   */
  async privileges(remote: string): Promise<PluginPrivilege[]> {
    const res = await this.request(`/plugins/privileges`, "GET", undefined, undefined, { remote })
    return (await res.json()) as PluginPrivilege[]
  }

  /**
   * Pull a plugin
   * @param options - Pull options
   * @returns Plugin configuration
   */
  async pull(options: PullPluginOptions): Promise<PluginConfig> {
    const res = await this.request(`/plugins/pull`, "POST", undefined, undefined, options)
    return (await res.json()) as PluginConfig
  }

  /**
   * Get plugin details
   * @param name - Plugin name
   * @returns Plugin configuration
   */
  async inspect(name: string): Promise<PluginConfig> {
    const res = await this.request(`/plugins/${name}/json`, "GET")
    return (await res.json()) as PluginConfig
  }

  /**
   * Remove a plugin
   * @param name - Plugin name
   * @param options - Remove options
   */
  async remove(name: string, options?: RemovePluginOptions): Promise<void> {
    await this.request(`/plugins/${name}`, "DELETE", undefined, undefined, options)
  }

  /**
   * Enable a plugin
   * @param name - Plugin name
   * @param options - Enable options
   */
  async enable(name: string, options?: EnablePluginOptions): Promise<void> {
    await this.request(`/plugins/${name}/enable`, "POST", undefined, undefined, options)
  }

  /**
   * Disable a plugin
   * @param name - Plugin name
   * @param options - Disable options
   */
  async disable(name: string, options?: DisablePluginOptions): Promise<void> {
    await this.request(`/plugins/${name}/disable`, "POST", undefined, undefined, options)
  }

  /**
   * Upgrade a plugin
   * @param name - Plugin name
   * @param options - Upgrade options
   * @returns Plugin configuration
   */
  async upgrade(name: string, options: UpgradePluginOptions): Promise<PluginConfig> {
    const res = await this.request(
      `/plugins/${name}/upgrade`,
      "POST",
      undefined,
      undefined,
      options
    )
    return (await res.json()) as PluginConfig
  }

  /**
   * Create a plugin
   * @param options - Create options
   * @returns Plugin configuration
   */
  async create(options: CreatePluginOptions): Promise<PluginConfig> {
    const res = await this.request(`/plugins/create`, "POST", options.path, undefined, {
      name: options.name,
    })
    return (await res.json()) as PluginConfig
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
  async set(name: string, options: SetPluginOptions): Promise<void> {
    await this.request(`/plugins/${name}/set`, "POST", JSON.stringify(options.settings))
  }
}
