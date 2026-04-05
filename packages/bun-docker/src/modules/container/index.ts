import type { BodyInit } from "bun"
import type { DockerWebSocket } from "../_socket"
import { BaseModule } from "../base"
import type {
  ArchiveInfo,
  AttachOptions,
  ContainerConfig,
  ContainerCreateResponse,
  ContainerInspectResponse,
  ContainerPruneResponse,
  ContainerStatsResponse,
  ContainerSummary,
  ContainerTopResponse,
  ContainerUpdateResponse,
  ContainerWaitResponse,
  CreateContainerOptions,
  ExecCreateOptions,
  ExecCreateResponse,
  ExecInspectResponse,
  ExecStartOptions,
  FilesystemChange,
  ListContainersOptions,
  LogsOptions,
  PruneContainersOptions,
  StatsOptions,
  UpdateContainerOptions,
  WaitCondition,
} from "./types"
import type { paths } from "../../v1.54"

/**
 * Container Module - handles all Docker container operations
 */
export class ContainerModule extends BaseModule {
  /**
   * List containers
   * @param options - List options
   * @returns Array of container summaries
   */
  async list(options?: ListContainersOptions): Promise<paths["/containers/json"]["get"]["responses"]["200"]["content"]["application/json"]> {
    const path = `/containers/json`
    const res = await this.request(path, "GET", undefined, undefined, options)
    return (await res.json()) as paths["/containers/json"]["get"]["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Create a container
   * @param config - Container configuration
   * @param options - Create options
   * @returns Container create response with ID
   */
  async create(
    config: paths["/containers/create"]["post"]["requestBody"]["content"]["application/json"],
    options?: paths["/containers/create"]["post"]["parameters"]["query"]
  ): Promise<paths["/containers/create"]["post"]["responses"]["201"]["content"]["application/json"]> {
    const path = `/containers/create`
    const res = await this.request(path, "POST", config, undefined, options)
    return (await res.json()) as paths["/containers/create"]["post"]["responses"]["201"]["content"]["application/json"]
  }

  /**
   * Inspect a container
   * @param id - Container ID or name
   * @param size - Return container size information
   * @returns Detailed container information
   */
  async inspect(id: string, size: boolean = false): Promise<paths["/containers/{id}/json"]["get"]["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/containers/${id}/json`, "GET", undefined, undefined, {
      size: size,
    })
    return (await res.json()) as paths["/containers/{id}/json"]["get"]["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Start a container
   * @param id - Container ID or name
   * @param detachKeys - Override the key sequence for detaching
   */
  async start(id: string, detachKeys?: string): Promise<paths["/containers/{id}/start"]["post"]["responses"]["204"]["content"]> {
    await this.request(`/containers/${id}/start`, "POST", undefined, undefined, {
      detachKeys: detachKeys,
    })
  }

  /**
   * Stop a container
   * @param id - Container ID or name
   * @param t - Number of seconds to wait before killing the container
   */
  async stop(id: string, options: paths["/containers/{id}/stop"]["post"]["parameters"]["query"]): Promise<paths["/containers/{id}/stop"]["post"]["responses"]["204"]["content"]> {
    await this.request(`/containers/${id}/stop`, "POST", undefined, undefined, options)
  }

  /**
   * Restart a container
   * @param id - Container ID or name
   * @param t - Number of seconds to wait before killing the container
   */
  async restart(id: string, options: paths["/containers/{id}/restart"]["post"]["parameters"]["query"]): Promise<paths["/containers/{id}/restart"]["post"]["responses"]["204"]["content"]> {
    await this.request(`/containers/${id}/restart`, "POST", undefined, undefined, options)
  }

  /**
   * Kill a container
   * @param id - Container ID or name
   * @param signal - Signal to send to the container
   */
  async kill(id: string, signal?: string): Promise<void> {
    await this.request(`/containers/${id}/kill`, "POST", undefined, undefined, { signal: signal })
  }

  /**
   * Remove a container
   * @param id - Container ID or name
   * @param v - Remove anonymous volumes associated with the container
   * @param force - Force removal of running containers
   * @param link - Remove the specified link associated with the container
   */
  async remove(
    id: string,
    v: boolean = false,
    force: boolean = false,
    link: boolean = false
  ): Promise<void> {
    await this.request(`/containers/${id}`, "DELETE", undefined, undefined, {
      v: v,
      force: force,
      link: link,
    })
  }

  /**
   * Rename a container
   * @param id - Container ID or name
   * @param name - New name for the container
   */
  async rename(id: string, name: string): Promise<void> {
    await this.request(`/containers/${id}/rename`, "POST", undefined, undefined, { name: name })
  }

  /**
   * Pause a container
   * @param id - Container ID or
 name
   */
  async pause(id: string): Promise<void> {
    await this.request(`/containers/${id}/pause`, "POST")
  }

  /**
   * Unpause a container
   * @param id - Container ID or name
   */
  async unpause(id: string): Promise<void> {
    await this.request(`/containers/${id}/unpause`, "POST")
  }

  /**
   * Wait for a container
   * @param id - Container ID or name
   * @param condition - Wait until condition is met
   * @returns Container wait response with exit status
   */
  async wait(id: string, condition?: WaitCondition): Promise<ContainerWaitResponse> {
    const res = await this.request(`/containers/${id}/wait`, "POST", undefined, undefined, {
      condition: condition,
    })
    return (await res.json()) as ContainerWaitResponse
  }

  /**
   * List processes running inside a container
   * @param id - Container ID or name
   * @param ps_args - Arguments for ps command
   * @returns Top processes response
   */
  async top(id: string, ps_args?: string): Promise<ContainerTopResponse> {
    const res = await this.request(`/containers/${id}/top`, "GET", undefined, undefined, {
      ps_args: encodeURIComponent(ps_args || ""),
    })
    return (await res.json()) as ContainerTopResponse
  }

  /**
   * Get container logs
   * @param id - Container ID or name
   * @param options - Log options
   * @returns Log stream
   */
  async logs(id: string, options?: LogsOptions): Promise<Response> {
    return await this.request(`/containers/${id}/logs`, "GET", undefined, undefined, options)
  }

  /**
   * Get container resource usage statistics
   * @param id - Container ID or name
   * @param options - Stats options
   * @returns Container stats response
   */
  async stats(id: string, options?: StatsOptions): Promise<ContainerStatsResponse | Response> {
    const res = await this.request(`/containers/${id}/stats`, "GET", undefined, undefined, options)

    if (options?.stream) {
      return res
    }

    return (await res.json()) as ContainerStatsResponse
  }

  /**
   * Get changes on container filesystem
   * @param id - Container ID or name
   * @returns Array of filesystem changes
   */
  async changes(id: string): Promise<FilesystemChange[]> {
    const res = await this.request(`/containers/${id}/changes`, "GET")
    return (await res.json()) as FilesystemChange[]
  }

  /**
   * Export a container
   * @param id - Container ID or name
   * @returns Exported container archive
   */
  async export(id: string): Promise<Response> {
    return await this.request(`/containers/${id}/export`, "GET")
  }

  /**
   * Update container configuration
   * @param id - Container ID or name
   * @param options - Update options
   * @returns Update response with warnings
   */
  async update(id: string, options: UpdateContainerOptions): Promise<ContainerUpdateResponse> {
    const res = await this.request(`/containers/${id}/update`, "POST", options)
    return res.json() as ContainerUpdateResponse
  }

  /**
   * Resize container TTY
   * @param id - Container ID or name
   * @param h - Height of the TTY session
   * @param w - Width of the TTY session
   */
  async resize(id: string, h: number, w: number): Promise<void> {
    await this.request(`/containers/${id}/resize`, "POST", undefined, undefined, { h: h, w: w })
  }

  /**
   * Attach to a container
   * @param id - Container ID or name
   * @param options - Attach options
   * @returns Attach connection
   */
  async attach(id: string, options?: AttachOptions): Promise<Response> {
    return await this.request(`/containers/${id}/attach`, "POST", undefined, undefined, options)
  }

  /**
   * Attach to a container via WebSocket
   * @param id - Container ID or name
   * @param options - Attach options
   * @returns WebSocket-like connection
   * @note Uses the attach endpoint with stream wrapping for compatibility with Unix sockets
   */
  async attachWebSocket(id: string, options?: AttachOptions): Promise<DockerWebSocket> {
    const response = await this.request(
      `/containers/${id}/attach`,
      "POST",
      undefined,
      undefined,
      options
    )

    this.ws.attach(response)

    return this.ws
  }

  /**
   * Get an archive of a filesystem resource in a container
   * @param id - Container ID or name
   * @param path - Resource path in the container
   * @returns Archive stream
   */

  async getArchive(id: string, path: string): Promise<Response> {
    return await this.request(`/containers/${id}/archive`, "GET", undefined, undefined, {
      path: path,
    })
  }

  /**
   * Check if a file exists in a container
   * @param id - Container ID or name
   * @param path - Resource path in the container
   * @returns Archive info or null
   */
  async archiveInfo(id: string, path: string): Promise<ArchiveInfo | null> {
    const res = await this.request(`/containers/${id}/archive`, "HEAD", undefined, undefined, {
      path: path,
    })

    const dockerContentType = res.headers.get("X-Docker-Container-Path-Stat")
    if (!dockerContentType) return null

    try {
      return JSON.parse(dockerContentType)
    } catch {
      return null
    }
  }

  /**
   * Extract an archive of files or folders to a directory in the container
   * @param id - Container ID or name
   * @param path - Path to extract to
   * @param archive - Archive to extract
   * @param noOverwriteDirNonDir - If true, will not overwrite a dir with a non-dir
   * @param copyUIDGID - If set to true, copy ownership from archive to target
   */
  async putArchive(
    id: string,
    path: string,
    archive: BodyInit,
    noOverwriteDirNonDir: boolean = false,
    copyUIDGID: boolean = false
  ): Promise<void> {
    await this.request(`/containers/${id}/archive`, "PUT", archive, undefined, {
      path: path,
      noOverwriteDirNonDir: noOverwriteDirNonDir,
      copyUIDGID: copyUIDGID,
    })
  }

  /**
   * Create an exec instance
   * @param id - Container ID or name
   * @param options - Exec create options
   * @returns Exec create response with exec ID
   */
  async execCreate(id: string, options: ExecCreateOptions): Promise<ExecCreateResponse> {
    const res = await this.request(`/containers/${id}/exec`, "POST", options)
    return (await res.json()) as ExecCreateResponse
  }

  /**
   * Start an exec instance
   * @param id - Exec ID
   * @param options - Exec start options
   * @returns Exec stream
   */
  async execStart(id: string, options?: ExecStartOptions): Promise<Response> {
    const res = await this.request(`/exec/${id}/start`, "POST", undefined, undefined, options)
    return res
  }

  /**
   * Inspect an exec instance
   * @param id - Exec ID
   * @returns Exec inspect response
   */
  async execInspect(id: string): Promise<ExecInspectResponse> {
    const res = await this.request(`/exec/${id}/json`, "GET")
    return (await res.json()) as ExecInspectResponse
  }

  /**
   * Resize an exec TTY
   * @param id - Exec ID
   * @param h - Height of the TTY session
   * @param w - Width of the TTY session
   */
  async execResize(id: string, h: number, w: number): Promise<void> {
    await this.request(`/exec/${id}/resize`, "POST", undefined, undefined, { h: h, w: w })
  }

  /**
   * Delete stopped containers
   * @param options - Prune options
   * @returns Prune response with deleted containers and reclaimed space
   */
  async prune(options?: PruneContainersOptions): Promise<ContainerPruneResponse> {
    const res = await this.request(`/containers/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as ContainerPruneResponse
  }
}
