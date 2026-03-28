/**
 * Stacks Module
 *
 * Provides operations for Docker Swarm stack management.
 */

import Docker from "dockerode"
import type {
  DockerConnectionOptions,
  ServiceInfo,
  StackDeployOptions,
  StackInfo,
  StackListResult,
} from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
import type { SwarmLogger } from "../../utils/logger"
import { parseEnvContent, validateComposeStructure } from "../../utils/parser"

/**
 * Stacks Module
 *
 * Manages Docker Swarm stack operations.
 */
export class StacksModule {
  private docker: Docker
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * Deploy a stack to the swarm
   */
  async deploy(options: StackDeployOptions): Promise<StackInfo> {
    // Validate compose structure
    const validation = validateComposeStructure(options.compose)
    if (!validation.valid) {
      throw new SwarmError(
        SwarmErrorCode.INVALID_COMPOSE,
        `Invalid compose file: ${validation.errors.join(", ")}`
      )
    }

    const stackName = options.name

    // Build environment
    const envVars = parseEnvContent(options.envContent ?? "")
    if (options.env) {
      Object.assign(envVars, options.env)
    }

    // Parse compose and create services
    const serviceSpecs = this.parseComposeServices(options.compose, stackName, envVars, options)

    try {
      // Create or update each service
      for (const serviceSpec of serviceSpecs) {
        const serviceName = serviceSpec.Name as string
        const existingServices = await this.docker.listServices({
          filters: { name: [serviceName] },
        } as Parameters<typeof this.docker.listServices>[0])

        if (existingServices.length > 0) {
          const existing = existingServices[0] as Record<string, unknown>
          if (existing.ID) {
            const service = this.docker.getService(existing.ID as string)
            const version = (existing.Version as Record<string, unknown>)?.Index ?? 0
            await service.update(serviceSpec, { version } as Parameters<
              Docker["getService"] extends () => infer R ? R : never
            >["update"] extends (spec: unknown, opts: infer O) => unknown
              ? O
              : never)
          }
        } else {
          await this.docker.createService(
            serviceSpec as Parameters<typeof this.docker.createService>[0]
          )
        }
      }

      const stackServices = await this.getStackServices(stackName)

      return {
        name: stackName,
        services: stackServices,
        networks: this.extractNetworks(options.compose, stackName),
        secrets: this.extractSecrets(options.compose),
        configs: this.extractConfigs(options.compose),
      }
    } catch (error) {
      throw new SwarmError(
        SwarmErrorCode.STACK_DEPLOY_FAILED,
        `Failed to deploy stack ${stackName}: ${(error as Error).message}`
      )
    }
  }

  /**
   * List all stacks in the swarm
   */
  async list(): Promise<StackListResult[]> {
    const services = await this.docker.listServices()

    // Group services by stack (using label)
    const stackMap = new Map<string, { services: number; networks: Set<string> }>()

    for (const service of services) {
      const spec = service.Spec as Record<string, unknown> | undefined
      const labels = spec?.Labels as Record<string, string> | undefined
      const stackName = labels?.["com.docker.stack.namespace"]
      if (stackName) {
        const existing = stackMap.get(stackName) ?? { services: 0, networks: new Set<string>() }
        existing.services++
        stackMap.set(stackName, existing)
      }
    }

    return Array.from(stackMap.entries()).map(([name, data]) => ({
      name,
      services: data.services,
      networks: data.networks.size,
      secrets: 0,
      configs: 0,
      orchestrator: "swarm" as const,
    }))
  }

  /**
   * Get a specific stack by name
   */
  async get(name: string): Promise<StackInfo | undefined> {
    const services = await this.getStackServices(name)

    if (services.length === 0) {
      return undefined
    }

    return {
      name,
      services,
      networks: [],
      secrets: [],
      configs: [],
    }
  }

  /**
   * Get services for a stack
   */
  async getStackServices(stackName: string): Promise<ServiceInfo[]> {
    const services = await this.docker.listServices({
      filters: {
        label: [`com.docker.stack.namespace=${stackName}`],
      },
    } as Parameters<typeof this.docker.listServices>[0])

    return services.map((service) => this.mapServiceInfo(service as Record<string, unknown>))
  }

  /**
   * Remove a stack from the swarm
   */
  async remove(name: string): Promise<void> {
    const services = await this.getStackServices(name)

    if (services.length === 0) {
      throw new SwarmError(SwarmErrorCode.STACK_NOT_FOUND, `Stack ${name} not found`)
    }

    for (const service of services) {
      try {
        await this.docker.getService(service.id).remove()
      } catch (error) {
        this.logger.error(`Failed to remove service ${service.spec.name}`, error)
      }
    }
  }

  /**
   * Parse compose services into Docker service specs
   */
  private parseComposeServices(
    compose: string,
    stackName: string,
    envVars: Record<string, string>,
    options: StackDeployOptions
  ): Record<string, unknown>[] {
    const services: Record<string, unknown>[] = []
    const lines = compose.split("\n")

    let inServices = false
    let currentService: string | null = null
    let currentIndent = 0
    const serviceContent: Record<string, unknown> = {}

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed === "services:") {
        inServices = true
        currentIndent = line.search(/\S/) + 2
        continue
      }

      if (!inServices) continue

      const indent = line.search(/\S/)
      if (indent >= 0 && indent < currentIndent && !trimmed.startsWith("#") && trimmed !== "") {
        break
      }

      if (trimmed.startsWith("#") || trimmed === "") continue

      // Check for service name
      if (!trimmed.startsWith("-") && trimmed.endsWith(":") && indent === currentIndent) {
        if (currentService) {
          services.push(
            this.buildServiceSpec(currentService, serviceContent, stackName, envVars, options)
          )
        }
        currentService = trimmed.slice(0, -1).trim()
        Object.keys(serviceContent).forEach((key) => delete serviceContent[key])
        continue
      }

      // Parse service property
      if (currentService) {
        const colonIndex = trimmed.indexOf(":")
        if (colonIndex > 0) {
          const key = trimmed.slice(0, colonIndex).trim()
          let value: unknown = trimmed.slice(colonIndex + 1).trim()

          if (value === "" || value === null) {
            value = {}
          } else if (value === "true" || value === "false") {
            value = value === "true"
          } else if (typeof value === "string" && /^\d+$/.test(value)) {
            value = parseInt(value, 10)
          } else if (typeof value === "string") {
            value = value.replace(/^["']|["']$/g, "")
          }

          serviceContent[key] = value
        }
      }
    }

    // Save last service
    if (currentService) {
      services.push(
        this.buildServiceSpec(currentService, serviceContent, stackName, envVars, options)
      )
    }

    return services
  }

  /**
   * Build a Docker service spec from parsed compose service
   */
  private buildServiceSpec(
    name: string,
    content: Record<string, unknown>,
    stackName: string,
    envVars: Record<string, string>,
    options: StackDeployOptions
  ): Record<string, unknown> {
    const serviceName = `${stackName}_${name}`

    // Get image, resolve env vars
    let image = content.image as string | undefined
    if (image) {
      image = this.resolveEnvVars(image, envVars)
    }

    const spec: Record<string, unknown> = {
      Name: serviceName,
      Labels: {
        "com.docker.stack.namespace": stackName,
        "com.docker.stack.service.name": name,
      },
      TaskTemplate: {
        ContainerSpec: {
          Image: image,
        },
      },
      Mode: {
        Replicated: {
          Replicas: ((content.deploy as Record<string, unknown>)?.replicas as number) ?? 1,
        },
      },
    }

    // Environment variables
    const envList: string[] = []
    const serviceEnv = content.environment as Record<string, string> | string[] | undefined
    if (serviceEnv) {
      if (Array.isArray(serviceEnv)) {
        for (const env of serviceEnv) {
          envList.push(this.resolveEnvVars(env, envVars))
        }
      } else {
        for (const [key, value] of Object.entries(serviceEnv)) {
          envList.push(`${key}=${this.resolveEnvVars(value, envVars)}`)
        }
      }
    }
    if (envList.length > 0) {
      ;(spec.TaskTemplate as Record<string, unknown>).ContainerSpec = {
        ...((spec.TaskTemplate as Record<string, unknown>).ContainerSpec as Record<
          string,
          unknown
        >),
        Env: envList,
      }
    }

    // Ports
    const ports = content.ports as string[] | undefined
    if (ports && ports.length > 0) {
      spec.EndpointSpec = {
        Ports: ports.map((p) => this.parsePortMapping(p)),
      }
    }

    // Networks
    const networks = content.networks as string[] | undefined
    if (networks && networks.length > 0) {
      ;(spec.TaskTemplate as Record<string, unknown>).Networks = networks.map((n) => ({
        Target: n.startsWith(stackName) ? n : `${stackName}_${n}`,
      }))
    }

    // Volumes
    const volumes = content.volumes as string[] | undefined
    if (volumes && volumes.length > 0) {
      ;(spec.TaskTemplate as Record<string, unknown>).ContainerSpec = {
        ...((spec.TaskTemplate as Record<string, unknown>).ContainerSpec as Record<
          string,
          unknown
        >),
        Mounts: volumes.map((v) => this.parseVolume(v)),
      }
    }

    // Command
    if (content.command) {
      const cmd = content.command as string | string[]
      ;(spec.TaskTemplate as Record<string, unknown>).ContainerSpec = {
        ...((spec.TaskTemplate as Record<string, unknown>).ContainerSpec as Record<
          string,
          unknown
        >),
        Command: Array.isArray(cmd) ? cmd : [cmd],
      }
    }

    // Placement constraints for target node
    if (options.targetNode) {
      ;(spec.TaskTemplate as Record<string, unknown>).Placement = {
        Constraints: [`node.id == ${options.targetNode}`],
      }
    }

    return spec
  }

  /**
   * Resolve environment variable references
   */
  private resolveEnvVars(value: string, envVars: Record<string, string>): string {
    return value.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, braced, unbraced) => {
      const varName = braced ?? unbraced
      const parts = varName.split(":-")
      const envName = parts[0] ?? ""
      const defaultValue = parts[1] ?? ""
      return envVars[envName] ?? defaultValue ?? match
    })
  }

  /**
   * Parse port mapping string
   */
  private parsePortMapping(port: string): Record<string, unknown> {
    let protocol: "tcp" | "udp" | "sctp" = "tcp"
    let portSpec = port

    if (port.endsWith("/tcp")) {
      protocol = "tcp"
      portSpec = port.slice(0, -4)
    } else if (port.endsWith("/udp")) {
      protocol = "udp"
      portSpec = port.slice(0, -4)
    }

    const parts = portSpec.split(":")
    if (parts.length === 1) {
      const target = parseInt(parts[0] ?? "", 10)
      return { TargetPort: target, Protocol: protocol }
    }

    if (parts.length === 2) {
      const published = parseInt(parts[0] ?? "", 10)
      const target = parseInt(parts[1] ?? "", 10)
      return {
        PublishedPort: published,
        TargetPort: target,
        Protocol: protocol,
      }
    }

    const published = parseInt(parts[1] ?? "", 10)
    const target = parseInt(parts[2] ?? "", 10)
    return {
      PublishedPort: published,
      TargetPort: target,
      Protocol: protocol,
    }
  }

  /**
   * Parse volume string
   */
  private parseVolume(volume: string): Record<string, unknown> {
    const parts = volume.split(":")

    if (parts.length >= 2) {
      const options = parts[2]?.split(",")
      return {
        Type: "bind",
        Source: parts[0] ?? "",
        Target: parts[1] ?? "",
        ReadOnly: options?.includes("ro"),
      }
    }

    return {
      Type: "bind",
      Source: volume,
      Target: volume,
    }
  }

  /**
   * Extract network names from compose
   */
  private extractNetworks(compose: string, stackName: string): string[] {
    const networks: string[] = []
    const lines = compose.split("\n")
    let inNetworks = false

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed === "networks:") {
        inNetworks = true
        continue
      }

      if (!inNetworks) continue
      if (trimmed.startsWith("#") || trimmed === "") continue

      if (!trimmed.startsWith("-") && !trimmed.includes(":") && !line.startsWith(" ")) {
        break
      }

      if (trimmed.startsWith("- ")) {
        networks.push(trimmed.slice(2).trim())
      } else if (trimmed.endsWith(":")) {
        networks.push(trimmed.slice(0, -1).trim())
      }
    }

    return networks.map((n) => (n.startsWith(stackName) ? n : `${stackName}_${n}`))
  }

  /**
   * Extract secret names from compose
   */
  private extractSecrets(compose: string): string[] {
    const secrets: string[] = []
    const lines = compose.split("\n")
    let inSecrets = false

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed === "secrets:") {
        inSecrets = true
        continue
      }

      if (!inSecrets) continue
      if (trimmed.startsWith("#") || trimmed === "") continue

      if (!trimmed.startsWith("-") && !trimmed.includes(":") && !line.startsWith(" ")) {
        break
      }

      if (trimmed.startsWith("- ")) {
        secrets.push(trimmed.slice(2).trim())
      } else if (trimmed.endsWith(":")) {
        secrets.push(trimmed.slice(0, -1).trim())
      }
    }

    return secrets
  }

  /**
   * Extract config names from compose
   */
  private extractConfigs(compose: string): string[] {
    const configs: string[] = []
    const lines = compose.split("\n")
    let inConfigs = false

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed === "configs:") {
        inConfigs = true
        continue
      }

      if (!inConfigs) continue
      if (trimmed.startsWith("#") || trimmed === "") continue

      if (!trimmed.startsWith("-") && !trimmed.includes(":") && !line.startsWith(" ")) {
        break
      }

      if (trimmed.startsWith("- ")) {
        configs.push(trimmed.slice(2).trim())
      } else if (trimmed.endsWith(":")) {
        configs.push(trimmed.slice(0, -1).trim())
      }
    }

    return configs
  }

  /**
   * Map Docker service response to ServiceInfo
   */
  private mapServiceInfo(service: Record<string, unknown>): ServiceInfo {
    const spec = service.Spec as Record<string, unknown> | undefined
    const version = service.Version as Record<string, unknown> | undefined

    return {
      id: (service.ID as string) ?? "",
      version: {
        index: (version?.Index as number) ?? 0,
      },
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
