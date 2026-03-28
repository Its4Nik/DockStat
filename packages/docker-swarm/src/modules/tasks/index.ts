/**
 * Tasks Module
 *
 * Provides operations for Docker Swarm task management.
 */

import Docker from "dockerode"
import type { DockerConnectionOptions, TaskInfo, TaskListFilters } from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
import type { SwarmLogger } from "../../utils/logger"

/**
 * Tasks Module
 *
 * Manages Docker Swarm task operations.
 */
export class TasksModule {
  private docker: Docker
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * List all tasks in the swarm
   */
  async list(filters?: TaskListFilters): Promise<TaskInfo[]> {
    const listFilters: Record<string, string[]> = {}

    if (filters) {
      if (filters.id) {
        listFilters.id = Array.isArray(filters.id) ? filters.id : [filters.id]
      }
      if (filters.name) {
        listFilters.name = Array.isArray(filters.name) ? filters.name : [filters.name]
      }
      if (filters.service) {
        listFilters.service = Array.isArray(filters.service) ? filters.service : [filters.service]
      }
      if (filters.node) {
        listFilters["node"] = Array.isArray(filters.node) ? filters.node : [filters.node]
      }
      if (filters.label) {
        listFilters.label = Array.isArray(filters.label) ? filters.label : [filters.label]
      }
      if (filters.desiredState) {
        listFilters["desired-state"] = Array.isArray(filters.desiredState)
          ? filters.desiredState
          : [filters.desiredState]
      }
    }

    const tasks = await this.docker.listTasks({
      filters: Object.keys(listFilters).length > 0 ? listFilters : undefined,
    } as Parameters<typeof this.docker.listTasks>[0])

    return tasks.map((task) => this.mapTaskInfo(task))
  }

  /**
   * Get a specific task by ID
   */
  async get(taskId: string): Promise<TaskInfo> {
    try {
      const task = await this.docker.getTask(taskId).inspect()
      return this.mapTaskInfo(task)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.TASK_NOT_FOUND, `Task ${taskId} not found`)
      }
      throw error
    }
  }

  /**
   * List tasks for a specific service
   */
  async listByService(serviceId: string): Promise<TaskInfo[]> {
    return this.list({ service: serviceId })
  }

  /**
   * List tasks for a specific node
   */
  async listByNode(nodeId: string): Promise<TaskInfo[]> {
    return this.list({ node: nodeId })
  }

  /**
   * List running tasks
   */
  async listRunning(): Promise<TaskInfo[]> {
    return this.list({ desiredState: "running" })
  }

  /**
   * List failed tasks
   */
  async listFailed(): Promise<TaskInfo[]> {
    const tasks = await this.list()
    return tasks.filter((t) => t.status.state === "failed" || t.status.state === "rejected")
  }

  /**
   * Map Docker task response to TaskInfo
   */
  private mapTaskInfo(task: Record<string, unknown>): TaskInfo {
    const spec = task.Spec as Record<string, unknown> | undefined
    const containerSpec = spec?.ContainerSpec as Record<string, unknown> | undefined
    const status = task.Status as Record<string, unknown> | undefined
    const containerStatus = status?.ContainerStatus as Record<string, unknown> | undefined
    const portStatus = status?.PortStatus as Record<string, unknown> | undefined
    const networksAttachments = task.NetworksAttachments as
      | Array<Record<string, unknown>>
      | undefined

    return {
      id: (task.ID as string) ?? "",
      version: {
        index: ((task.Version as Record<string, unknown>)?.Index as number) ?? 0,
      },
      createdAt: (task.CreatedAt as string) ?? "",
      updatedAt: (task.UpdatedAt as string) ?? "",
      name: task.Name as string | undefined,
      spec: {
        containerSpec: containerSpec
          ? {
              image: containerSpec.Image as string | undefined,
              command: containerSpec.Command as string[] | undefined,
              args: containerSpec.Args as string[] | undefined,
              env: containerSpec.Env as string[] | undefined,
              labels: containerSpec.Labels as Record<string, string> | undefined,
              hostname: containerSpec.Hostname as string | undefined,
            }
          : undefined,
      },
      serviceId: (task.ServiceID as string) ?? "",
      slot: task.Slot as number | undefined,
      nodeId: task.NodeID as string | undefined,
      status: {
        timestamp: (status?.Timestamp as string) ?? "",
        state: (status?.State as TaskInfo["status"]["state"]) ?? "new",
        message: status?.Message as string | undefined,
        err: status?.Err as string | undefined,
        containerStatus: containerStatus
          ? {
              containerId: containerStatus.ContainerID as string | undefined,
              pid: containerStatus.PID as number | undefined,
              exitCode: containerStatus.ExitCode as number | undefined,
            }
          : undefined,
        portStatus: portStatus
          ? {
              ports: Array.isArray(portStatus.Ports)
                ? (portStatus.Ports as Array<Record<string, unknown>>).map((p) => ({
                    protocol: (p.Protocol as string) ?? "",
                    publishedPort: (p.PublishedPort as number) ?? 0,
                    targetPort: (p.TargetPort as number) ?? 0,
                  }))
                : undefined,
            }
          : undefined,
      },
      desiredState: (task.DesiredState as TaskInfo["desiredState"]) ?? "new",
      networksAttachments: networksAttachments?.map((na) => {
        const network = na.Network as Record<string, unknown> | undefined
        const networkSpec = network?.Spec as Record<string, unknown> | undefined
        return {
          network: {
            id: (network?.ID as string) ?? "",
            spec: {
              name: (networkSpec?.Name as string) ?? "",
              labels: networkSpec?.Labels as Record<string, string> | undefined,
            },
          },
          addresses: (na.Addresses as string[]) ?? [],
        }
      }),
    }
  }
}

export * from "./types"
