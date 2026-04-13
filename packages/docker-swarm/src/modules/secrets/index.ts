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

/**
 * Secrets Module
 */
export class SecretsModule {
  private docker: Docker

  constructor(options: DockerConnectionOptions) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
  }

  async list(filters?: SecretListFilters): Promise<SecretInfo[]> {
    const listFilters: Record<string, string[]> = {}
    if (filters) {
      if (filters.id) listFilters.id = Array.isArray(filters.id) ? filters.id : [filters.id]
      if (filters.name)
        listFilters.name = Array.isArray(filters.name) ? filters.name : [filters.name]
      if (filters.label)
        listFilters.label = Array.isArray(filters.label) ? filters.label : [filters.label]
    }

    const secrets = await this.docker.listSecrets({
      filters: Object.keys(listFilters).length > 0 ? JSON.stringify(listFilters) : undefined,
    } as unknown)

    return (secrets as unknown[]).map((s) => this.mapSecretInfo(s as Record<string, unknown>))
  }

  async get(secretId: string): Promise<SecretInfo> {
    try {
      const secret = await this.docker.getSecret(secretId).inspect()
      return this.mapSecretInfo(secret as unknown as Record<string, unknown>)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SECRET_NOT_FOUND, `Secret ${secretId} not found`)
      }
      throw error
    }
  }

  async create(options: SecretCreateOptions): Promise<SecretInfo> {
    const data = typeof options.data === "string" ? Buffer.from(options.data) : options.data

    try {
      await this.docker.createSecret({
        Data: data.toString("base64"),
        Labels: options.labels,
        Name: options.name,
      } as unknown)

      const secrets = await this.list({ name: options.name })
      if (!secrets[0]) throw new Error("Created secret not found")
      return secrets[0]
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("name conflicts")) {
        throw new SwarmError(
          SwarmErrorCode.SECRET_NAME_CONFLICT,
          `Secret '${options.name}' already exists`
        )
      }
      throw error
    }
  }

  async remove(secretId: string): Promise<void> {
    try {
      await this.docker.getSecret(secretId).remove()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SECRET_NOT_FOUND, `Secret ${secretId} not found`)
      }
      throw error
    }
  }

  async getByName(name: string): Promise<SecretInfo | undefined> {
    const secrets = await this.list({ name })
    return secrets[0]
  }

  private mapSecretInfo(secret: Record<string, unknown>): SecretInfo {
    const spec = secret.Spec as Record<string, unknown> | undefined
    return {
      createdAt: (secret.CreatedAt as string) ?? "",
      id: (secret.ID as string) ?? "",
      spec: {
        labels: spec?.Labels as Record<string, string> | undefined,
        name: (spec?.Name as string) ?? "",
      },
      updatedAt: (secret.UpdatedAt as string) ?? "",
      version: { index: ((secret.Version as Record<string, unknown>)?.Index as number) ?? 0 },
    }
  }
}

export * from "./types"
