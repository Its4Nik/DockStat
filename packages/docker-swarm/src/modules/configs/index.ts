/**
 * Configs Module
 *
 * Provides operations for Docker Swarm config management.
 */

import Docker from "dockerode"
import type {
  ConfigCreateOptions,
  ConfigInfo,
  ConfigListFilters,
  DockerConnectionOptions,
} from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
import type { SwarmLogger } from "../../utils/logger"

/**
 * Configs Module
 *
 * Manages Docker Swarm config operations.
 */
export class ConfigsModule {
  private docker: Docker
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * List all configs
   */
  async list(filters?: ConfigListFilters): Promise<ConfigInfo[]> {
    const listFilters: Record<string, string[]> = {}

    if (filters) {
      if (filters.id) {
        listFilters.id = Array.isArray(filters.id) ? filters.id : [filters.id]
      }
      if (filters.name) {
        listFilters.name = Array.isArray(filters.name) ? filters.name : [filters.name]
      }
      if (filters.label) {
        listFilters.label = Array.isArray(filters.label) ? filters.label : [filters.label]
      }
    }

    const configs = await this.docker.listConfigs({
      filters: Object.keys(listFilters).length > 0 ? listFilters : undefined,
    })

    return configs.map((config) => this.mapConfigInfo(config))
  }

  /**
   * Get a specific config by ID
   */
  async get(configId: string): Promise<ConfigInfo> {
    try {
      const config = await this.docker.getConfig(configId).inspect()
      return this.mapConfigInfo(config)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.CONFIG_NOT_FOUND, `Config ${configId} not found`)
      }
      throw error
    }
  }

  /**
   * Create a new config
   */
  async create(options: ConfigCreateOptions): Promise<ConfigInfo> {
    const data = typeof options.data === "string" ? Buffer.from(options.data) : options.data

    try {
      const config = await this.docker.createConfig({
        Name: options.name,
        Data: data.toString("base64"),
        Labels: options.labels,
        Templating: options.templating,
      })

      return this.mapConfigInfo(config)
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("name conflicts")) {
        throw new SwarmError(
          SwarmErrorCode.CONFIG_NAME_CONFLICT,
          `Config name '${options.name}' already exists`
        )
      }
      throw error
    }
  }

  /**
   * Remove a config
   */
  async remove(configId: string): Promise<void> {
    try {
      const config = this.docker.getConfig(configId)
      await config.remove()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.CONFIG_NOT_FOUND, `Config ${configId} not found`)
      }
      throw error
    }
  }

  /**
   * Get config by name
   */
  async getByName(name: string): Promise<ConfigInfo | undefined> {
    const configs = await this.list({ name })
    return configs[0]
  }

  /**
   * Map Docker config response to ConfigInfo
   */
  private mapConfigInfo(config: Docker.ConfigInfo): ConfigInfo {
    return {
      id: config.ID ?? "",
      version: {
        index: config.Version?.index ?? 0,
      },
      createdAt: config.CreatedAt ?? "",
      updatedAt: config.UpdatedAt ?? "",
      spec: {
        name: config.Spec?.Name ?? "",
        labels: config.Spec?.Labels,
        templating: config.Spec?.Templating
          ? {
              name: config.Spec.Templating.Name,
              options: config.Spec.Templating.Options,
            }
          : undefined,
      },
    }
  }
}

export * from "./types"
