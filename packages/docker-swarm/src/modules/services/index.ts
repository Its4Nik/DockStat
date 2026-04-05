/**
 * Services Module
 *
 * Provides operations for Docker Swarm service management.
 */

import type Logger from "@dockstat/logger"
import Docker from "dockerode"
import type {
  DockerConnectionOptions,
  ServiceCreateOptions,
  ServiceInfo,
  ServiceListFilters,
  ServiceLogsOptions,
  ServiceUpdateOptions,
} from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
/**
 * Services Module
 */
export class ServicesModule {
  private docker: Docker

  constructor(options: DockerConnectionOptions, logger: Logger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * List all services in the swarm
   */
  async list(filters?: ServiceListFilters): Promise<ServiceInfo[]> {
    const listFilters: Record<string, string[]> = {}

    if (filters) {
      if (filters.id) listFilters.id = Array.isArray(filters.id) ? filters.id : [filters.id]
      if (filters.name)
        listFilters.name = Array.isArray(filters.name) ? filters.name : [filters.name]
      if (filters.label)
        listFilters.label = Array.isArray(filters.label) ? filters.label : [filters.label]
      if (filters.mode) listFilters.mode = [filters.mode]
    }

    const services = await this.docker.listServices({
      filters: Object.keys(listFilters).length > 0 ? JSON.stringify(listFilters) : undefined,
    } as unknown)

    return (services as unknown[]).map((s) => this.mapServiceInfo(s as Record<string, unknown>))
  }

  /**
   * Get a specific service by ID or name
   */
  async get(serviceId: string): Promise<ServiceInfo> {
    try {
      const service = await this.docker.getService(serviceId).inspect()
      return this.mapServiceInfo(service as unknown as Record<string, unknown>)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SERVICE_NOT_FOUND, `Service ${serviceId} not found`)
      }
      throw error
    }
  }

  /**
   * Create a new service
   */
  async create(options: ServiceCreateOptions): Promise<ServiceInfo> {
    const spec = this.buildServiceSpec(options)

    try {
      await this.docker.createService(spec as unknown)
      return await this.get(options.name)
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("name conflicts") || message.includes("already exists")) {
        throw new SwarmError(
          SwarmErrorCode.SERVICE_NAME_CONFLICT,
          `Service name '${options.name}' already exists`
        )
      }
      throw new SwarmError(
        SwarmErrorCode.SERVICE_UPDATE_FAILED,
        `Failed to create service: ${message}`
      )
    }
  }

  /**
   * Update an existing service
   */
  async update(serviceId: string, options: ServiceUpdateOptions): Promise<ServiceInfo> {
    try {
      const service = this.docker.getService(serviceId)
      const current = (await service.inspect()) as unknown as Record<string, unknown>
      const currentSpec = current.Spec as Record<string, unknown> | undefined
      const currentTaskTemplate = currentSpec?.TaskTemplate as Record<string, unknown> | undefined

      const spec = {
        ...(currentSpec ?? {}),
        TaskTemplate: {
          ...(currentTaskTemplate ?? {}),
          ...this.buildTaskSpec(options),
        },
        Mode: options.replicas ? { Replicated: { Replicas: options.replicas } } : currentSpec?.Mode,
        Labels: options.labels ?? currentSpec?.Labels,
      }

      await (
        service as unknown as { update: (spec: unknown, opts: unknown) => Promise<void> }
      ).update(spec, {
        version:
          options.version ?? ((current.Version as Record<string, unknown>)?.Index as number) ?? 0,
      })

      return await this.get(serviceId)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SERVICE_NOT_FOUND, `Service ${serviceId} not found`)
      }
      throw new SwarmError(
        SwarmErrorCode.SERVICE_UPDATE_FAILED,
        `Failed to update service: ${(error as Error).message}`
      )
    }
  }

  /**
   * Scale a service
   */
  async scale(serviceId: string, replicas: number): Promise<ServiceInfo> {
    try {
      const service = this.docker.getService(serviceId)
      const current = (await service.inspect()) as unknown as Record<string, unknown>
      const currentSpec = current.Spec as Record<string, unknown> | undefined

      const spec = {
        ...(currentSpec ?? {}),
        Mode: { Replicated: { Replicas: replicas } },
      }

      await (
        service as unknown as { update: (spec: unknown, opts: unknown) => Promise<void> }
      ).update(spec, {
        version: ((current.Version as Record<string, unknown>)?.Index as number) ?? 0,
      })

      return await this.get(serviceId)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SERVICE_NOT_FOUND, `Service ${serviceId} not found`)
      }
      throw new SwarmError(
        SwarmErrorCode.SERVICE_SCALE_FAILED,
        `Failed to scale service: ${(error as Error).message}`
      )
    }
  }

  /**
   * Remove a service
   */
  async remove(serviceId: string): Promise<void> {
    try {
      await this.docker.getService(serviceId).remove()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SERVICE_NOT_FOUND, `Service ${serviceId} not found`)
      }
      throw error
    }
  }

  /**
   * Get service logs
   */
  async logs(serviceId: string, options: ServiceLogsOptions = {}): Promise<string> {
    try {
      const logs = await this.docker.getService(serviceId).logs({
        stdout: options.stdout ?? true,
        stderr: options.stderr ?? true,
        tail: options.tail ?? 100,
        follow: options.follow ?? false,
        timestamps: options.timestamps ?? false,
        since: options.since,
        until: options.until,
      } as unknown)
      return logs.toString()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.SERVICE_NOT_FOUND, `Service ${serviceId} not found`)
      }
      throw error
    }
  }

  /**
   * Get service by name
   */
  async getByName(name: string): Promise<ServiceInfo | undefined> {
    const services = await this.list({ name })
    return services[0]
  }

  /**
   * Build service spec
   */
  private buildServiceSpec(
    options: ServiceCreateOptions | ServiceUpdateOptions
  ): Record<string, unknown> {
    const spec: Record<string, unknown> = {
      TaskTemplate: this.buildTaskSpec(options),
    }

    // Name is only available in ServiceCreateOptions
    if ("name" in options && options.name) {
      spec.Name = options.name
    }

    if ("mode" in options && options.mode === "global") {
      spec.Mode = { Global: {} }
    } else {
      spec.Mode = { Replicated: { Replicas: options.replicas ?? 1 } }
    }

    if (options.labels) spec.Labels = options.labels
    if (options.ports?.length) {
      spec.EndpointSpec = {
        Ports: options.ports.map((p) => ({
          Protocol: p.protocol ?? "tcp",
          TargetPort: p.target,
          PublishedPort: typeof p.published === "number" ? p.published : undefined,
        })),
      }
    }

    return spec
  }

  /**
   * Build task spec
   */
  private buildTaskSpec(
    options: ServiceCreateOptions | ServiceUpdateOptions
  ): Record<string, unknown> {
    const taskSpec: Record<string, unknown> = {}
    const containerSpec: Record<string, unknown> = {}

    if ("image" in options && options.image) containerSpec.Image = options.image
    if ("command" in options && options.command) containerSpec.Command = options.command
    if ("args" in options && options.args) containerSpec.Args = options.args
    if (options.env) {
      containerSpec.Env = Array.isArray(options.env)
        ? options.env
        : Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
    }
    if ("containerLabels" in options && options.containerLabels)
      containerSpec.Labels = options.containerLabels
    if ("networks" in options && options.networks?.length) {
      taskSpec.Networks = options.networks.map((n) => ({ Target: n }))
    }
    if (options.resources) {
      taskSpec.Resources = {
        Limits: options.resources.limits
          ? {
              NanoCPUs: options.resources.limits.nanoCPUs,
              MemoryBytes: options.resources.limits.memoryBytes,
            }
          : undefined,
        Reservations: options.resources.reservations
          ? {
              NanoCPUs: options.resources.reservations.nanoCPUs,
              MemoryBytes: options.resources.reservations.memoryBytes,
            }
          : undefined,
      }
    }
    if ("restartPolicy" in options && options.restartPolicy) {
      taskSpec.RestartPolicy = options.restartPolicy
    }
    if ("constraints" in options && options.constraints?.length) {
      taskSpec.Placement = { Constraints: options.constraints }
    }
    if ("logDriver" in options && options.logDriver) {
      taskSpec.LogDriver = { Name: options.logDriver, Options: options.logOptions }
    }

    taskSpec.ContainerSpec = containerSpec
    return taskSpec
  }

  /**
   * Map Docker service response
   */
  private mapServiceInfo(service: Record<string, unknown>): ServiceInfo {
    const spec = service.Spec as Record<string, unknown> | undefined
    const version = service.Version as Record<string, unknown> | undefined

    return {
      id: (service.ID as string) ?? "",
      version: { index: (version?.Index as number) ?? 0 },
      createdAt: (service.CreatedAt as string) ?? "",
      updatedAt: (service.UpdatedAt as string) ?? "",
      spec: {
        name: (spec?.Name as string) ?? "",
        labels: spec?.Labels as Record<string, string> | undefined,
        taskTemplate: {},
      },
    }
  }
}

export * from "./types"
