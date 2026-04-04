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
    const params = new URLSearchParams()
    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters))
    }

    const query = params.toString()
    const path = `/plugins${query ? `?${query}` : ""}`

    const res = await this.request(path, "GET")
    return (await res.json()) as PluginConfig[]
  }

  /**
   * Get plugin privileges
   * @param remote - Remote name or plugin name
   * @returns Array of plugin privileges
   */
  async privileges(remote: string): Promise<PluginPrivilege[]> {
    const query = `remote=${encodeURIComponent(remote)}`
    const path = `/plugins/privileges?${query}`
    const res = await this.request(path, "GET")
    return (await res.json()) as PluginPrivilege[]
  }

  /**
   * Pull a plugin
   * @param options - Pull options
   * @returns Plugin configuration
   */
  async pull(options: PullPluginOptions): Promise<PluginConfig> {
    const params = new URLSearchParams()
    params.append("remote", options.remote)
    if (options.name) {
      params.append("name", options.name)
    }
    if (options.privileges) {
      params.append("privileges", JSON.stringify(options.privileges))
    }

    const query = params.toString()
    const path = `/plugins/pull?${query}`
    const res = await this.request(path, "POST")
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
    const params = new URLSearchParams()
    if (options?.force) {
      params.append("force", "true")
    }

    const query = params.toString()
    const path = `/plugins/${name}${query ? `?${query}` : ""}`
    await this.request(path, "DELETE")
  }

  /**
   * Enable a plugin
   * @param name - Plugin name
   * @param options - Enable options
   */
  async enable(name: string, options?: EnablePluginOptions): Promise<void> {
    const params = new URLSearchParams()
    if (options?.timeout) {
      params.append("timeout", options.timeout.toString())
    }

    const query = params.toString()
    const path = `/plugins/${name}/enable${query ? `?${query}` : ""}`
    await this.request(path, "POST")
  }

  /**
   * Disable a plugin
   * @param name - Plugin name
   * @param options - Disable options
   */
  async disable(name: string, options?: DisablePluginOptions): Promise<void> {
    const params = new URLSearchParams()
    if (options?.timeout) {
      params.append("timeout", options.timeout.toString())
    }

    const query = params.toString()
    const path = `/plugins/${name}/disable${query ? `?${query}` : ""}`
    await this.request(path, "POST")
  }

  /**
   * Upgrade a plugin
   * @param name - Plugin name
   * @param options - Upgrade options
   * @returns Plugin configuration
   */
  async upgrade(name: string, options: UpgradePluginOptions): Promise<PluginConfig> {
    const params = new URLSearchParams()
    params.append("remote", options.remote)
    if (options.privileges) {
      params.append("privileges", JSON.stringify(options.privileges))
    }

    const query = params.toString()
    const path = `/plugins/${name}/upgrade?${query}`
    const res = await this.request(path, "POST")
    return (await res.json()) as PluginConfig
  }

  /**
   * Create a plugin
   * @param options - Create options
   * @returns Plugin configuration
   */
  async create(options: CreatePluginOptions): Promise<PluginConfig> {
    const params = new URLSearchParams()
    params.append("name", options.name)

    const query = params.toString()
    const path = `/plugins/create?${query}`
    const res = await this.request(path, "POST", options.path)
    return (await res.json()) as PluginConfig
  }

  /**
   * Push a plugin
   * @param name - Plugin name
   */
  async push(name: string): Promise<void> {
    const path = `/plugins/${name}/push`
    await this.request(path, "POST")
  }

  /**
   * Set plugin settings
   * @param name - Plugin name
   * @param options - Set options
   */
  async set(name: string, options: SetPluginOptions): Promise<void> {
    const path = `/plugins/${name}/set`
    await this.request(path, "POST", JSON.stringify(options.settings))
  }
}
