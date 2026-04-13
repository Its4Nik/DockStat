/**
 * Tasks Module
 *
 * Provides operations for Docker Swarm task monitoring.
 */

import Docker from "dockerode"
import type { DockerConnectionOptions, TaskInfo, TaskListFilters } from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
import type { SwarmLogger } from "../../utils/logger"

/**
 * Tasks Module
 */
export class TasksModule {
  private docker: Docker

  constructor(options: DockerConnectionOptions, _logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
  }

  /**
   * List all tasks in the swarm
   */
  async list(filters?: TaskListFilters): Promise<TaskInfo[]> {
    const listFilters: Record<string, string[]> = {}

    if (filters) {
      if (filters.id) listFilters.id = Array.isArray(filters.id) ? filters.id : [filters.id]
      if (filters.name)
        listFilters.name = Array.isArray(filters.name) ? filters.name : [filters.name]
      if (filters.service)
        listFilters.service = Array.isArray(filters.service) ? filters.service : [filters.service]
      if (filters.node)
        listFilters.node = Array.isArray(filters.node) ? filters.node : [filters.node]
      if (filters.label)
        listFilters.label = Array.isArray(filters.label) ? filters.label : [filters.label]
      if (filters.desiredState) {
        listFilters["desired-state"] = Array.isArray(filters.desiredState)
          ? filters.desiredState.map((s) => s)
          : [filters.desiredState]
      }
    }

    const tasks = await this.docker.listTasks({
      filters: Object.keys(listFilters).length > 0 ? JSON.stringify(listFilters) : undefined,
    } as unknown)

    return (tasks as unknown[]).map((task) => this.mapTaskInfo(task as Record<string, unknown>))
  }

  /**
   * Get a specific task by ID
   */
  async get(taskId: string): Promise<TaskInfo> {
    try {
      const task = await this.docker.getTask(taskId).inspect()
      return this.mapTaskInfo(task as unknown as Record<string, unknown>)
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
   * Map Docker task response
   */
  private mapTaskInfo(task: Record<string, unknown>): TaskInfo {
    const spec = task.Spec as Record<string, unknown> | undefined
    const containerSpec = spec?.ContainerSpec as Record<string, unknown> | undefined
    const status = task.Status as Record<string, unknown> | undefined
    const containerStatus = status?.ContainerStatus as Record<string, unknown> | undefined
    const version = task.Version as Record<string, unknown> | undefined

    return {
      createdAt: (task.CreatedAt as string) ?? "",
      desiredState: (task.DesiredState as TaskInfo["desiredState"]) ?? "new",
      id: (task.ID as string) ?? "",
      name: task.Name as string | undefined,
      nodeId: task.NodeID as string | undefined,
      serviceId: (task.ServiceID as string) ?? "",
      slot: task.Slot as number | undefined,
      spec: {
        containerSpec: containerSpec
          ? {
              args: containerSpec.Args as string[] | undefined,
              command: containerSpec.Command as string[] | undefined,
              env: containerSpec.Env as string[] | undefined,
              hostname: containerSpec.Hostname as string | undefined,
              image: containerSpec.Image as string | undefined,
              labels: containerSpec.Labels as Record<string, string> | undefined,
            }
          : undefined,
      },
      status: {
        containerStatus: containerStatus
          ? {
              containerId: containerStatus.ContainerID as string | undefined,
              exitCode: containerStatus.ExitCode as number | undefined,
              pid: containerStatus.PID as number | undefined,
            }
          : undefined,
        err: status?.Err as string | undefined,
        message: status?.Message as string | undefined,
        state: (status?.State as TaskInfo["status"]["state"]) ?? "new",
        timestamp: (status?.Timestamp as string) ?? "",
      },
      updatedAt: (task.UpdatedAt as string) ?? "",
      version: { index: (version?.Index as number) ?? 0 },
    }
  }
}

export * from "./types"
