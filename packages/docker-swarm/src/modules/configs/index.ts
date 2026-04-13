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

/**
 * Configs Module
 */
export class ConfigsModule {
  private docker: Docker

  constructor(options: DockerConnectionOptions) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
  }

  async list(filters?: ConfigListFilters): Promise<ConfigInfo[]> {
    const listFilters: Record<string, string[]> = {}
    if (filters) {
      if (filters.id) listFilters.id = Array.isArray(filters.id) ? filters.id : [filters.id]
      if (filters.name)
        listFilters.name = Array.isArray(filters.name) ? filters.name : [filters.name]
      if (filters.label)
        listFilters.label = Array.isArray(filters.label) ? filters.label : [filters.label]
    }

    const configs = await this.docker.listConfigs({
      filters: Object.keys(listFilters).length > 0 ? JSON.stringify(listFilters) : undefined,
    } as unknown)

    return (configs as unknown[]).map((c) => this.mapConfigInfo(c as Record<string, unknown>))
  }

  async get(configId: string): Promise<ConfigInfo> {
    try {
      const config = await this.docker.getConfig(configId).inspect()
      return this.mapConfigInfo(config as unknown as Record<string, unknown>)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.CONFIG_NOT_FOUND, `Config ${configId} not found`)
      }
      throw error
    }
  }

  async create(options: ConfigCreateOptions): Promise<ConfigInfo> {
    const data = typeof options.data === "string" ? Buffer.from(options.data) : options.data

    try {
      await this.docker.createConfig({
        Data: data.toString("base64"),
        Labels: options.labels,
        Name: options.name,
      } as unknown)

      const configs = await this.list({ name: options.name })
      if (!configs[0]) throw new Error("Created config not found")
      return configs[0]
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("name conflicts")) {
        throw new SwarmError(
          SwarmErrorCode.CONFIG_NAME_CONFLICT,
          `Config '${options.name}' already exists`
        )
      }
      throw error
    }
  }

  async remove(configId: string): Promise<void> {
    try {
      await this.docker.getConfig(configId).remove()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.CONFIG_NOT_FOUND, `Config ${configId} not found`)
      }
      throw error
    }
  }

  async getByName(name: string): Promise<ConfigInfo | undefined> {
    const configs = await this.list({ name })
    return configs[0]
  }

  private mapConfigInfo(config: Record<string, unknown>): ConfigInfo {
    const spec = config.Spec as Record<string, unknown> | undefined
    return {
      createdAt: (config.CreatedAt as string) ?? "",
      id: (config.ID as string) ?? "",
      spec: {
        labels: spec?.Labels as Record<string, string> | undefined,
        name: (spec?.Name as string) ?? "",
      },
      updatedAt: (config.UpdatedAt as string) ?? "",
      version: { index: ((config.Version as Record<string, unknown>)?.Index as number) ?? 0 },
    }
  }
}

export * from "./types"
