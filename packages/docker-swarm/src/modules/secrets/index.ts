/**
 * Secrets Module
 *
 * Provides operations for Docker Swarm secret management.
 */

import Docker from "dockerode"
import type {
  DockerConnectionOptions,
  SecretCreateOptions,
  SecretInfo,
  SecretListFilters,
} from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
import type { SwarmLogger } from "../../utils/logger"

/**
 * Secrets Module
 *
 * Manages Docker Swarm secret operations.
 */
export class SecretsModule {
  private docker: Docker
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * List all secrets
   */
  async list(filters?: SecretListFilters): Promise<SecretInfo[]> {
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
      if (filters.mode) {
        listFilters.mode = [filters.mode]
      }
    }

    const secrets = await this.docker.listSecrets({
      filters: Object.keys(listFilters).length > 0 ? listFilters : undefined,
    } as Parameters<typeof this.docker.listSecrets>[0])

    return secrets.map((secret) => this.mapSecretInfo(secret as Record<string, unknown>))
  }

  /**
   * Get a specific secret by ID
   */
  async get(secretId: string): Promise<SecretInfo> {
    try {
      const secret = await this.docker.getSecret(secretId).inspect()
      return this.mapSecretInfo(secret as Record<string, unknown>)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SECRET_NOT_FOUND, `Secret ${secretId} not found`)
      }
      throw error
    }
  }

  /**
   * Create a new secret
   */
  async create(options: SecretCreateOptions): Promise<SecretInfo> {
    const data = typeof options.data === "string" ? Buffer.from(options.data) : options.data

    try {
      const secret = await this.docker.createSecret({
        Name: options.name,
        Data: data.toString("base64"),
        Labels: options.labels,
        Driver: options.driver,
        Templating: options.templating,
      } as Parameters<typeof this.docker.createSecret>[0])

      return this.mapSecretInfo(secret as Record<string, unknown>)
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("name conflicts")) {
        throw new SwarmError(
          SwarmErrorCode.SECRET_NAME_CONFLICT,
          `Secret name '${options.name}' already exists`
        )
      }
      throw error
    }
  }

  /**
   * Remove a secret
   */
  async remove(secretId: string): Promise<void> {
    try {
      const secret = this.docker.getSecret(secretId)
      await secret.remove()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SECRET_NOT_FOUND, `Secret ${secretId} not found`)
      }
      throw error
    }
  }

  /**
   * Get secret by name
   */
  async getByName(name: string): Promise<SecretInfo | undefined> {
    const secrets = await this.list({ name })
    return secrets[0]
  }

  /**
   * Map Docker secret response to SecretInfo
   */
  private mapSecretInfo(secret: Record<string, unknown>): SecretInfo {
    const spec = secret.Spec as Record<string, unknown> | undefined
    const version = secret.Version as Record<string, unknown> | undefined

    return {
      id: (secret.ID as string) ?? "",
      version: {
        index: (version?.Index as number) ?? 0,
      },
      createdAt: (secret.CreatedAt as string) ?? "",
      updatedAt: (secret.UpdatedAt as string) ?? "",
      spec: {
        name: (spec?.Name as string) ?? "",
        labels: spec?.Labels as Record<string, string> | undefined,
        driver: spec?.Driver
          ? {
              name: (spec.Driver as Record<string, unknown>).Name as string | undefined,
              options: (spec.Driver as Record<string, unknown>).Options as
                | Record<string, string>
                | undefined,
            }
          : undefined,
        templating: spec?.Templating
          ? {
              name: (spec.Templating as Record<string, unknown>).Name as string | undefined,
              options: (spec.Templating as Record<string, unknown>).Options as
                | Record<string, string>
                | undefined,
            }
          : undefined,
      },
    }
  }
}

export * from "./types"
