import type { BodyInit } from "bun"
import type { DockerWebSocket } from "../_socket"
import { BaseModule } from "../base"
import type {
  ContainerArchiveGetRoute,
  ContainerArchiveHeadRoute,
  ContainerArchivePutRoute,
  ContainerAttachRoute,
  ContainerChangesRoute,
  ContainerCreateRoute,
  ContainerExecRoute,
  ContainerInspectRoute,
  ContainerListRoute,
  ContainerLogsRoute,
  ContainerPruneRoute,
  ContainerResizeRoute,
  ContainerRestartRoute,
  ContainerStartRoute,
  ContainerStatsRoute,
  ContainerStopRoute,
  ContainerTopRoute,
  ContainerUpdateRoute,
  ContainerWaitRoute,
  ExecInspectRoute,
  ExecResizeRoute,
  ExecStartRoute,
} from "./types"

/**
 * Container Module - handles all Docker container operations
 */
export class ContainerModule extends BaseModule {
  /**
   * List containers
   * @param options - List options
   * @returns Array of container summaries
   */
  async list(
    options?: ContainerListRoute["parameters"]["query"]
  ): Promise<ContainerListRoute["responses"]["200"]["content"]["application/json"]> {
    const path = `/containers/json`
    const res = await this.request(path, "GET", undefined, undefined, options)
    return (await res.json()) as ContainerListRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Create a container
   * @param config - Container configuration
   * @param options - Create options
   * @returns Container create response with ID
   */
  async create(
    config: ContainerCreateRoute["requestBody"]["content"]["application/json"],
    options?: ContainerCreateRoute["parameters"]["query"]
  ): Promise<ContainerCreateRoute["responses"]["201"]["content"]["application/json"]> {
    const path = `/containers/create`
    const res = await this.request(path, "POST", config, undefined, options)
    return (await res.json()) as ContainerCreateRoute["responses"]["201"]["content"]["application/json"]
  }

  /**
   * Inspect a container
   * @param id - Container ID or name
   * @param size - Return container size information
   * @returns Detailed container information
   */
  async inspect(
    id: string,
    size: boolean = false
  ): Promise<ContainerInspectRoute["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/containers/${id}/json`, "GET", undefined, undefined, {
      size: size,
    })
    return (await res.json()) as ContainerInspectRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Start a container
   * @param id - Container ID or name
   * @param detachKeys - Override the key sequence for detaching
   */
  async start(
    id: string,
    detachKeys?: string
  ): Promise<ContainerStartRoute["responses"]["204"]["content"]> {
    await this.request(`/containers/${id}/start`, "POST", undefined, undefined, {
      detachKeys: detachKeys,
    })
  }

  /**
   * Stop a container
   * @param id - Container ID or name
   * @param t - Number of seconds to wait before killing the container
   */
  async stop(
    id: string,
    options: ContainerStopRoute["parameters"]["query"]
  ): Promise<ContainerStopRoute["responses"]["204"]["content"]> {
    await this.request(`/containers/${id}/stop`, "POST", undefined, undefined, options)
  }

  /**
   * Restart a container
   * @param id - Container ID or name
   * @param t - Number of seconds to wait before killing the container
   */
  async restart(
    id: string,
    options: ContainerRestartRoute["parameters"]["query"]
  ): Promise<ContainerRestartRoute["responses"]["204"]["content"]> {
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
   * @param options - Wait options
   * @returns Container wait response with exit status
   */
  async wait(
    id: string,
    options?: ContainerWaitRoute["parameters"]["query"]
  ): Promise<ContainerWaitRoute["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/containers/${id}/wait`, "POST", undefined, undefined, options)
    return (await res.json()) as ContainerWaitRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * List processes running inside a container
   * @param id - Container ID or name
   * @param options - Top options
   * @returns Top processes response
   */
  async top(
    id: string,
    options?: ContainerTopRoute["parameters"]["query"]
  ): Promise<ContainerTopRoute["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/containers/${id}/top`, "GET", undefined, undefined, options)
    return (await res.json()) as ContainerTopRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Get container logs
   * @param id - Container ID or name
   * @param options - Log options
   * @returns Log stream
   */
  async logs(id: string, options?: ContainerLogsRoute["parameters"]["query"]): Promise<Response> {
    return await this.request(`/containers/${id}/logs`, "GET", undefined, undefined, options)
  }

  /**
   * Get container resource usage statistics
   * @param id - Container ID or name
   * @param options - Stats options
   * @returns Container stats response
   */
  async stats(
    id: string,
    options?: ContainerStatsRoute["parameters"]["query"]
  ): Promise<ContainerStatsRoute["responses"]["200"]["content"]["application/json"] | Response> {
    const res = await this.request(`/containers/${id}/stats`, "GET", undefined, undefined, options)

    if (options?.stream) {
      return res
    }

    return (await res.json()) as ContainerStatsRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Get changes on container filesystem
   * @param id - Container ID or name
   * @returns Array of filesystem changes
   */
  async changes(
    id: string
  ): Promise<ContainerChangesRoute["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/containers/${id}/changes`, "GET")
    return (await res.json()) as ContainerChangesRoute["responses"]["200"]["content"]["application/json"]
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
  async update(
    id: string,
    options: ContainerUpdateRoute["requestBody"]["content"]["application/json"]
  ): Promise<ContainerUpdateRoute["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/containers/${id}/update`, "POST", options)
    return res.json() as ContainerUpdateRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Resize container TTY
   * @param id - Container ID or name
   * @param options - Resize options
   */
  async resize(id: string, options: ContainerResizeRoute["parameters"]["query"]): Promise<void> {
    await this.request(`/containers/${id}/resize`, "POST", undefined, undefined, options)
  }

  /**
   * Attach to a container
   * @param id - Container ID or name
   * @param options - Attach options
   * @returns Attach connection
   */
  async attach(
    id: string,
    options?: ContainerAttachRoute["parameters"]["query"]
  ): Promise<Response> {
    return await this.request(`/containers/${id}/attach`, "POST", undefined, undefined, options)
  }

  /**
   * Attach to a container via WebSocket
   * @param id - Container ID or name
   * @param options - Attach options
   * @returns WebSocket-like connection
   * @note Uses the attach endpoint with stream wrapping for compatibility with Unix sockets
   */
  async attachWebSocket(
    id: string,
    options?: ContainerAttachRoute["parameters"]["query"]
  ): Promise<DockerWebSocket> {
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
   * @param options - Archive options
   * @returns Archive stream
   */

  async getArchive(
    id: string,
    options: ContainerArchiveGetRoute["parameters"]["query"]
  ): Promise<Response> {
    return await this.request(`/containers/${id}/archive`, "GET", undefined, undefined, options)
  }

  /**
   * Check if a file exists in a container
   * @param id - Container ID or name
   * @param options - Archive info options
   * @returns Archive info or null
   */
  async archiveInfo(
    id: string,
    options: ContainerArchiveHeadRoute["parameters"]["query"]
  ): Promise<
    ContainerArchiveHeadRoute["responses"]["200"]["headers"]["X-Docker-Container-Path-Stat"] | null
  > {
    const res = await this.request(
      `/containers/${id}/archive`,
      "HEAD",
      undefined,
      undefined,
      options
    )

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
   * @param options - Put archive options
   * @param archive - Archive to extract
   */
  async putArchive(
    id: string,
    options: ContainerArchivePutRoute["parameters"]["query"],
    archive: BodyInit
  ): Promise<void> {
    await this.request(`/containers/${id}/archive`, "PUT", archive, undefined, options)
  }

  /**
   * Create an exec instance
   * @param id - Container ID or name
   * @param options - Exec create options
   * @returns Exec create response with exec ID
   */
  async execCreate(
    id: string,
    options: ContainerExecRoute["requestBody"]["content"]["application/json"]
  ): Promise<ContainerExecRoute["responses"]["201"]["content"]["application/json"]> {
    const res = await this.request(`/containers/${id}/exec`, "POST", options)
    return (await res.json()) as ContainerExecRoute["responses"]["201"]["content"]["application/json"]
  }

  /**
   * Start an exec instance
   * @param id - Exec ID
   * @param options - Exec start options
   * @returns Exec stream
   */
  async execStart(
    id: string,
    options?: NonNullable<ExecStartRoute["requestBody"]>["content"]["application/json"]
  ): Promise<Response> {
    const res = await this.request(`/exec/${id}/start`, "POST", undefined, undefined, options)
    return res
  }

  /**
   * Inspect an exec instance
   * @param id - Exec ID
   * @returns Exec inspect response
   */
  async execInspect(
    id: string
  ): Promise<ExecInspectRoute["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/exec/${id}/json`, "GET")
    return (await res.json()) as ExecInspectRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Resize an exec TTY
   * @param id - Exec ID
   * @param options - Resize options
   */
  async execResize(id: string, options: ExecResizeRoute["parameters"]["query"]): Promise<void> {
    await this.request(`/exec/${id}/resize`, "POST", undefined, undefined, options)
  }

  /**
   * Delete stopped containers
   * @param options - Prune options
   * @returns Prune response with deleted containers and reclaimed space
   */
  async prune(
    options?: ContainerPruneRoute["parameters"]["query"]
  ): Promise<ContainerPruneRoute["responses"]["200"]["content"]["application/json"]> {
    const res = await this.request(`/containers/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as ContainerPruneRoute["responses"]["200"]["content"]["application/json"]
  }
}
