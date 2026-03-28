/**
 * Services Module
 *
 * Provides operations for Docker Swarm service management.
 */

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
import type { SwarmLogger } from "../../utils/logger"

/**
 * Services Module
 *
 * Manages Docker Swarm service operations.
 */
export class ServicesModule {
  private docker: Docker
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * List all services in the swarm
   */
  async list(filters?: ServiceListFilters): Promise<ServiceInfo[]> {
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

    const services = await this.docker.listServices({
      filters: Object.keys(listFilters).length > 0 ? listFilters : undefined,
    } as Parameters<typeof this.docker.listServices>[0])

    return services.map((service) => this.mapServiceInfo(service))
  }

  /**
   * Get a specific service by ID or name
   */
  async get(serviceId: string): Promise<ServiceInfo> {
    try {
      const service = await this.docker.getService(serviceId).inspect()
      return this.mapServiceInfo(service)
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
    const serviceSpec = this.buildServiceSpec(options)

    try {
      const service = await this.docker.createService(
        serviceSpec as Parameters<typeof this.docker.createService>[0]
      )
      const info = await service.inspect()
      return this.mapServiceInfo(info)
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("name conflicts")) {
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
      const current = await service.inspect()

      const spec = {
        ...current.Spec,
        TaskTemplate: {
          ...current.Spec?.TaskTemplate,
          ...this.buildTaskSpec(options),
        },
        Mode: options.replicas
          ? { Replicated: { Replicas: options.replicas } }
          : current.Spec?.Mode,
        Labels: options.labels ?? current.Spec?.Labels,
        UpdateConfig: options.updateConfig ?? current.Spec?.UpdateConfig,
        RollbackConfig: options.rollbackConfig ?? current.Spec?.RollbackConfig,
      }

      await service.update(spec, {
        version: options.version ?? (current.Version as Record<string, unknown>)?.Index ?? 0,
      } as Parameters<Docker["getService"] extends () => infer R ? R : never>["update"] extends (
        spec: unknown,
        opts: infer O
      ) => unknown
        ? O
        : never)

      return this.get(serviceId)
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
      const current = await service.inspect()

      const spec = {
        ...current.Spec,
        Mode: {
          Replicated: {
            Replicas: replicas,
          },
        },
      }

      await service.update(spec, {
        version: (current.Version as Record<string, unknown>)?.Index ?? 0,
      } as Parameters<Docker["getService"] extends () => infer R ? R : never>["update"] extends (
        spec: unknown,
        opts: infer O
      ) => unknown
        ? O
        : never)

      return this.get(serviceId)
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
      const service = this.docker.getService(serviceId)
      await service.remove()
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
      const service = this.docker.getService(serviceId)
      const logs = await service.logs({
        stdout: options.stdout ?? true,
        stderr: options.stderr ?? true,
        tail: options.tail ?? 100,
        follow: options.follow ?? false,
        timestamps: options.timestamps ?? false,
        since: options.since,
        until: options.until,
        details: options.details,
      } as Parameters<Docker["getService"] extends () => infer R ? R : never>["logs"] extends (
        opts: infer O
      ) => unknown
        ? O
        : never)
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
   * Build service spec for creation
   */
  private buildServiceSpec(options: ServiceCreateOptions): Record<string, unknown> {
    const spec: Record<string, unknown> = {
      Name: options.name,
      TaskTemplate: this.buildTaskSpec(options),
    }

    // Service mode
    if (options.mode === "global") {
      spec.Mode = { Global: {} }
    } else {
      spec.Mode = {
        Replicated: {
          Replicas: options.replicas ?? 1,
        },
      }
    }

    // Service labels
    if (options.labels) {
      spec.Labels = options.labels
    }

    // Endpoint spec (ports)
    if (options.ports && options.ports.length > 0) {
      spec.EndpointSpec = {
        Ports: options.ports.map((p) => ({
          Protocol: p.protocol ?? "tcp",
          TargetPort: p.target,
          PublishedPort: typeof p.published === "number" ? p.published : undefined,
          PublishMode: p.mode,
        })),
      }
    }

    // Update config
    if (options.updateConfig) {
      spec.UpdateConfig = {
        Parallelism: options.updateConfig.parallelism,
        Delay: options.updateConfig.delay,
        FailureAction: options.updateConfig.failureAction,
        Monitor: options.updateConfig.monitor,
        MaxFailureRatio: options.updateConfig.maxFailureRatio,
        Order: options.updateConfig.order,
      }
    }

    // Rollback config
    if (options.rollbackConfig) {
      spec.RollbackConfig = {
        Parallelism: options.rollbackConfig.parallelism,
        Delay: options.rollbackConfig.delay,
        FailureAction: options.rollbackConfig.failureAction,
        Monitor: options.rollbackConfig.monitor,
        MaxFailureRatio: options.rollbackConfig.maxFailureRatio,
        Order: options.rollbackConfig.order,
      }
    }

    return spec
  }

  /**
   * Build task spec for service
   */
  private buildTaskSpec(
    options: ServiceCreateOptions | ServiceUpdateOptions
  ): Record<string, unknown> {
    const taskSpec: Record<string, unknown> = {}
    const containerSpec: Record<string, unknown> = {}

    // Image
    if ("image" in options && options.image) {
      containerSpec.Image = options.image
    }

    // Command
    if ("command" in options && options.command) {
      containerSpec.Command = options.command
    }

    // Args
    if ("args" in options && options.args) {
      containerSpec.Args = options.args
    }

    // Environment
    if (options.env) {
      containerSpec.Env = Array.isArray(options.env)
        ? options.env
        : Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
    }

    // Container labels
    if ("containerLabels" in options && options.containerLabels) {
      containerSpec.Labels = options.containerLabels
    }

    // User
    if ("user" in options && options.user) {
      containerSpec.User = options.user
    }

    // Working directory
    if ("workdir" in options && options.workdir) {
      containerSpec.Dir = options.workdir
    }

    // Hostname
    if ("hostname" in options && options.hostname) {
      containerSpec.Hostname = options.hostname
    }

    // Stop grace period
    if ("stopGracePeriod" in options && options.stopGracePeriod) {
      containerSpec.StopGracePeriod = options.stopGracePeriod * 1_000_000_000
    }

    // Mounts
    if ("mounts" in options && options.mounts) {
      containerSpec.Mounts = options.mounts.map((m) => ({
        Type: m.type,
        Source: m.source,
        Target: m.target,
        ReadOnly: m.readOnly,
      }))
    }

    // Health check
    if ("healthCheck" in options && options.healthCheck) {
      containerSpec.HealthCheck = {
        Test: options.healthCheck.test,
        Interval: options.healthCheck.interval,
        Timeout: options.healthCheck.timeout,
        Retries: options.healthCheck.retries,
        StartPeriod: options.healthCheck.startPeriod,
      }
    }

    // DNS config
    if ("dnsConfig" in options && options.dnsConfig) {
      containerSpec.DNSConfig = {
        Nameservers: options.dnsConfig.nameservers,
        Search: options.dnsConfig.search,
        Options: options.dnsConfig.options,
      }
    }

    // Hosts
    if ("hosts" in options && options.hosts) {
      containerSpec.Hosts = options.hosts.map((h) => ({
        IP: h.ip,
        Hostnames: h.hostnames,
      }))
    }

    // Networks
    if ("networks" in options && options.networks) {
      taskSpec.Networks = options.networks.map((n) => ({
        Target: n,
      }))
    }

    // Resources
    if (options.resources) {
      taskSpec.Resources = {
        Limits: options.resources.limits
          ? {
              NanoCPUs: options.resources.limits.nanoCPUs,
              MemoryBytes: options.resources.limits.memoryBytes,
              Pids: options.resources.limits.pids,
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

    // Restart policy
    if ("restartPolicy" in options && options.restartPolicy) {
      taskSpec.RestartPolicy = {
        Condition: options.restartPolicy.condition,
        Delay: options.restartPolicy.delay,
        MaxAttempts: options.restartPolicy.maxAttempts,
        Window: options.restartPolicy.window,
      }
    }

    // Placement constraints
    if ("constraints" in options && options.constraints) {
      taskSpec.Placement = {
        Constraints: options.constraints,
      }
    }

    // Log driver
    if ("logDriver" in options && options.logDriver) {
      taskSpec.LogDriver = {
        Name: options.logDriver,
        Options: options.logOptions,
      }
    }

    taskSpec.ContainerSpec = containerSpec
    return taskSpec
  }

  /**
   * Map Docker service response to ServiceInfo
   */
  private mapServiceInfo(service: Record<string, unknown>): ServiceInfo {
    const spec = service.Spec as Record<string, unknown> | undefined
    const taskTemplate = spec?.TaskTemplate as Record<string, unknown> | undefined
    const containerSpec = taskTemplate?.ContainerSpec as Record<string, unknown> | undefined

    return {
      id: (service.ID as string) ?? "",
      version: {
        index: ((service.Version as Record<string, unknown>)?.Index as number) ?? 0,
      },
      createdAt: (service.CreatedAt as string) ?? "",
      updatedAt: (service.UpdatedAt as string) ?? "",
      spec: {
        name: (spec?.Name as string) ?? "",
        labels: spec?.Labels as Record<string, string> | undefined,
        mode: spec?.Mode
          ? (spec.Mode as Record<string, unknown>).Replicated
            ? {
                replicated: {
                  replicas:
                    (((spec.Mode as Record<string, unknown>).Replicated as Record<string, unknown>)
                      .Replicas as number) ?? 1,
                },
              }
            : (spec.Mode as Record<string, unknown>).Global
              ? { global: {} }
              : undefined
          : undefined,
        taskTemplate: {
          containerSpec: containerSpec
            ? {
                image: containerSpec.Image as string | undefined,
                command: containerSpec.Command as string[] | undefined,
                args: containerSpec.Args as string[] | undefined,
                env: containerSpec.Env as string[] | undefined,
                labels: containerSpec.Labels as Record<string, string> | undefined,
                hostname: containerSpec.Hostname as string | undefined,
                user: containerSpec.User as string | undefined,
                dir: containerSpec.Dir as string | undefined,
              }
            : undefined,
        },
      },
    }
  }
}

export * from "./types"
