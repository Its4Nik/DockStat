/**
 * Stacks Module
 *
 * Provides operations for Docker Swarm stack deployment.
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
 */
export class StacksModule {
  private docker: Docker
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * Deploy a stack to the swarm
   */
  async deploy(options: StackDeployOptions): Promise<StackInfo> {
    const validation = validateComposeStructure(options.compose)
    if (!validation.valid) {
      throw new SwarmError(
        SwarmErrorCode.INVALID_COMPOSE,
        `Invalid compose: ${validation.errors.join(", ")}`
      )
    }

    const stackName = options.name
    const envVars = { ...parseEnvContent(options.envContent ?? ""), ...options.env }
    const serviceSpecs = this.parseComposeServices(options.compose, stackName, envVars, options)

    try {
      for (const spec of serviceSpecs) {
        const name = spec.Name as string
        const existing = await this.docker.listServices({
          filters: JSON.stringify({ name: [name] }),
        } as unknown)

        if ((existing as unknown[]).length > 0) {
          const svc = (existing as unknown[])[0] as Record<string, unknown>
          if (svc.ID) {
            const service = this.docker.getService(svc.ID as string)
            await (
              service as unknown as { update: (spec: unknown, opts: unknown) => Promise<void> }
            ).update(spec, {
              version: ((svc.Version as Record<string, unknown>)?.Index as number) ?? 0,
            })
          }
        } else {
          await this.docker.createService(spec as unknown)
        }
      }

      return {
        name: stackName,
        services: await this.getStackServices(stackName),
        networks: this.extractNetworks(options.compose, stackName),
        secrets: this.extractSecrets(options.compose),
        configs: this.extractConfigs(options.compose),
      }
    } catch (error) {
      throw new SwarmError(
        SwarmErrorCode.STACK_DEPLOY_FAILED,
        `Failed to deploy stack: ${(error as Error).message}`
      )
    }
  }

  /**
   * List all stacks
   */
  async list(): Promise<StackListResult[]> {
    const services = (await this.docker.listServices()) as unknown[]
    const stackMap = new Map<string, number>()

    for (const s of services) {
      const spec = (s as Record<string, unknown>).Spec as Record<string, unknown> | undefined
      const labels = spec?.Labels as Record<string, string> | undefined
      const ns = labels?.["com.docker.stack.namespace"]
      if (ns) stackMap.set(ns, (stackMap.get(ns) ?? 0) + 1)
    }

    return Array.from(stackMap.entries()).map(([name, services]) => ({
      name,
      services,
      networks: 0,
      secrets: 0,
      configs: 0,
      orchestrator: "swarm" as const,
    }))
  }

  /**
   * Get stack services
   */
  async getStackServices(stackName: string): Promise<ServiceInfo[]> {
    const services = await this.docker.listServices({
      filters: JSON.stringify({ label: [`com.docker.stack.namespace=${stackName}`] }),
    } as unknown)

    return (services as unknown[]).map((s) => this.mapServiceInfo(s as Record<string, unknown>))
  }

  /**
   * Remove a stack
   */
  async remove(name: string): Promise<void> {
    const services = await this.getStackServices(name)
    if (services.length === 0) {
      throw new SwarmError(SwarmErrorCode.STACK_NOT_FOUND, `Stack ${name} not found`)
    }

    for (const svc of services) {
      try {
        await this.docker.getService(svc.id).remove()
      } catch (error) {
        this.logger.error(`Failed to remove service ${svc.spec.name}`, error)
      }
    }
  }

  /**
   * Parse compose services
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
    const serviceContent: Record<string, unknown> = {}
    const currentIndent = "  "

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === "services:") {
        inServices = true
        continue
      }
      if (!inServices || trimmed.startsWith("#") || trimmed === "") continue

      if (
        line.startsWith(currentIndent) &&
        !line.startsWith(currentIndent + currentIndent) &&
        trimmed.endsWith(":")
      ) {
        if (currentService)
          services.push(
            this.buildServiceSpec(currentService, serviceContent, stackName, envVars, options)
          )
        currentService = trimmed.slice(0, -1).trim()
        Object.keys(serviceContent).forEach((k) => delete serviceContent[k])
        continue
      }

      if (currentService) {
        const colonIdx = trimmed.indexOf(":")
        if (colonIdx > 0) {
          const key = trimmed.slice(0, colonIdx).trim()
          const value: unknown = trimmed
            .slice(colonIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, "")
          serviceContent[key] = value
        }
      }
    }

    if (currentService)
      services.push(
        this.buildServiceSpec(currentService, serviceContent, stackName, envVars, options)
      )
    return services
  }

  /**
   * Build service spec
   */
  private buildServiceSpec(
    name: string,
    content: Record<string, unknown>,
    stackName: string,
    envVars: Record<string, string>,
    options: StackDeployOptions
  ): Record<string, unknown> {
    const image = content.image ? this.resolveEnvVars(content.image as string, envVars) : undefined
    const envList: string[] = []
    const serviceEnv = content.environment as Record<string, string> | undefined
    if (serviceEnv) {
      for (const [k, v] of Object.entries(serviceEnv)) {
        envList.push(`${k}=${this.resolveEnvVars(v, envVars)}`)
      }
    }

    return {
      Name: `${stackName}_${name}`,
      Labels: { "com.docker.stack.namespace": stackName },
      TaskTemplate: {
        ContainerSpec: { Image: image, Env: envList.length > 0 ? envList : undefined },
      },
      Mode: { Replicated: { Replicas: 1 } },
    }
  }

  private resolveEnvVars(value: string, envVars: Record<string, string>): string {
    return value.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, braced, unbraced) => {
      const name = braced ?? unbraced
      const parts = name.split(":-")
      return envVars[parts[0] ?? ""] ?? parts[1] ?? ""
    })
  }

  private extractNetworks(compose: string, stackName: string): string[] {
    return []
  }
  private extractSecrets(compose: string): string[] {
    return []
  }
  private extractConfigs(compose: string): string[] {
    return []
  }

  private mapServiceInfo(service: Record<string, unknown>): ServiceInfo {
    const spec = service.Spec as Record<string, unknown> | undefined
    return {
      id: (service.ID as string) ?? "",
      version: { index: ((service.Version as Record<string, unknown>)?.Index as number) ?? 0 },
      createdAt: (service.CreatedAt as string) ?? "",
      updatedAt: (service.UpdatedAt as string) ?? "",
      spec: { name: (spec?.Name as string) ?? "", taskTemplate: {} },
    }
  }
}

export * from "./types"
