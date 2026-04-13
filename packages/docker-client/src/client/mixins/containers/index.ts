import type { paths } from "@dockstat/docker/spec"
import { retry } from "@dockstat/utils"
import { DockerClientBase } from "../../mixins/core/base"

// Type aliases for @bun-docker OpenAPI types
type BunDockerContainerList =
  paths["/containers/json"]["get"]["responses"]["200"]["content"]["application/json"]

type BunDockerContainerStats =
  paths["/containers/{id}/stats"]["get"]["responses"]["200"]["content"]["application/json"]
type BunDockerContainerLogsRoute = paths["/containers/{id}/logs"]["get"]
type BunDockerContainerExecRoute = paths["/containers/{id}/exec"]["post"]
type BunDockerExecStartRoute = paths["/exec/{id}/start"]["post"]

/**
 * Extended container info type that includes hostId and clientId
 * These fields are not part of the Docker API but are needed by the application
 */
export type ExtendedContainerInfo = BunDockerContainerList[number] & {
  hostId: number
  clientId: number
}

/**
 * Extended container stats type that includes hostId and clientId
 */
export type ExtendedContainerStats = BunDockerContainerStats & {
  hostId: number
  clientId: number
  containerId: string
  containerName: string
}

/**
 * Containers mixin: adds container listing, inspection, stats and lifecycle operations using @bun-docker.
 *
 * Usage: compose with DockerClientBase via applyMixins alongside other mixins.
 */
export class Containers extends DockerClientBase {
  // ---------- Queries ----------

  /**
   * Get all containers from all hosts
   */
  public async getAllContainers(): Promise<ExtendedContainerInfo[]> {
    this.checkDisposed()

    const hosts = this.hostHandler.getHosts()
    this.logger.info(`Fetching containers from all hosts (${hosts.length})`)

    if (hosts.length === 0) {
      this.logger.debug("No hosts found")
      return []
    }

    const all: ExtendedContainerInfo[] = []
    const results = await Promise.allSettled(
      hosts.map(async (host) => {
        const containers = await this.getContainersForHost(Number(host.id))
        all.push(...containers)
      })
    )

    for (const r of results) {
      if (r.status === "rejected") {
        this.logger.error(
          `getAllContainers: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`
        )
      }
    }

    return all
  }

  /**
   * Get containers for a specific host
   */
  public async getContainersForHost(hostId: number): Promise<ExtendedContainerInfo[]> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const containers = await retry(() => docker.containers.list({ all: true }), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    // Extend each container with hostId and clientId
    return containers.map((c) => ({
      ...c,
      clientId: this.id,
      hostId,
    }))
  }

  /**
   * Get detailed information for a specific container
   */
  public async getContainer(hostId: number, containerId: string): Promise<ExtendedContainerInfo> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const info = await retry(() => docker.containers.inspect(containerId), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    // Extend with hostId and clientId
    return {
      ...info,
      clientId: this.id,
      hostId,
    } as ExtendedContainerInfo
  }

  /**
   * Get container stats for all containers across all hosts
   */
  public async getAllContainerStats(): Promise<ExtendedContainerStats[]> {
    this.checkDisposed()

    const hosts = this.hostHandler.getHosts()
    const allStats: ExtendedContainerStats[] = []

    const results = await Promise.allSettled(
      hosts.map(async (host) => {
        const stats = await this.getContainerStatsForHost(Number(host.id))
        allStats.push(...stats)
      })
    )

    for (const r of results) {
      if (r.status === "rejected") {
        this.logger.error(
          `getAllContainerStats: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`
        )
      }
    }

    return allStats
  }

  /**
   * Get container stats for all containers on a specific host
   */
  public async getContainerStatsForHost(hostId: number): Promise<ExtendedContainerStats[]> {
    this.checkDisposed()

    const containers = await this.getContainersForHost(hostId)
    const running = containers.filter((c) => c.State === "running")

    const results = await Promise.allSettled(
      running.map((c) => this.getContainerStats(hostId, c.Id || ""))
    )

    const ok: ExtendedContainerStats[] = []
    for (const r of results) {
      if (r.status === "fulfilled") {
        ok.push(r.value)
      } else {
        this.logger.warn(
          `getContainerStatsForHost(${hostId}) item failed: ${
            r.reason instanceof Error ? r.reason.message : String(r.reason)
          }`
        )
      }
    }

    return ok
  }

  /**
   * Get stats for a specific container
   */
  public async getContainerStats(
    hostId: number,
    containerId: string
  ): Promise<ExtendedContainerStats> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = await this.getContainer(hostId, containerId)

    const stats = await retry(
      () =>
        docker.containers.stats(containerId, { stream: false }) as Promise<BunDockerContainerStats>,
      {
        attempts: this.options.retryAttempts,
        delay: this.options.retryDelay,
      }
    )

    return {
      ...stats,
      clientId: this.id,
      containerId,
      containerName: container.Names?.[0]?.replace(/^\//, "") || "unknown",
      hostId,
    }
  }

  // ---------- Lifecycle control ----------

  public async startContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.start(containerId), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async stopContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.stop(containerId, {}), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async restartContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.restart(containerId, {}), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async removeContainer(hostId: number, containerId: string, force = false): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.remove(containerId, false, force, false), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async pauseContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.pause(containerId), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async unpauseContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.unpause(containerId), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async killContainer(
    hostId: number,
    containerId: string,
    signal = "SIGKILL"
  ): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.kill(containerId, signal), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async renameContainer(
    hostId: number,
    containerId: string,
    newName: string
  ): Promise<void> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)
    await retry(() => docker.containers.rename(containerId, newName), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  // ---------- Logs & Exec ----------

  public async getContainerLogs(
    hostId: number,
    containerId: string,
    options: {
      stdout?: boolean
      stderr?: boolean
      timestamps?: boolean
      tail?: number
      since?: string
      until?: string
    } = {}
  ): Promise<string> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)

    // Convert string dates to Unix timestamps if provided
    let since: number | undefined
    let until: number | undefined
    if (options.since) {
      since = Math.floor(new Date(options.since).getTime() / 1000)
    }
    if (options.until) {
      until = Math.floor(new Date(options.until).getTime() / 1000)
    }

    const logOptions: BunDockerContainerLogsRoute["parameters"]["query"] = {
      since,
      stderr: options.stderr ?? true,
      stdout: options.stdout ?? true,
      tail: options.tail ? String(options.tail) : undefined,
      timestamps: options.timestamps ?? false,
      until,
    }

    const response = await retry(() => docker.containers.logs(containerId, logOptions), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
    const text = await response.text()
    return text
  }

  public async execInContainer(
    hostId: number,
    containerId: string,
    command: string[],
    options: {
      attachStdout?: boolean
      attachStderr?: boolean
      tty?: boolean
      env?: string[]
      workingDir?: string
    } = {}
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    this.checkDisposed()
    const docker = this.getDockerInstance(hostId)

    const execOptions: BunDockerContainerExecRoute["requestBody"]["content"]["application/json"] = {
      AttachStderr: options.attachStderr ?? true,
      AttachStdout: options.attachStdout ?? true,
      Cmd: command,
      Env: options.env,
      Tty: options.tty ?? false,
      WorkingDir: options.workingDir,
    }

    const execResult = await retry(() => docker.containers.execCreate(containerId, execOptions), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    const startOptions: NonNullable<
      BunDockerExecStartRoute["requestBody"]
    >["content"]["application/json"] = {
      Detach: false,
      Tty: options.tty ?? false,
    }

    const response = await retry(() => docker.containers.execStart(execResult.Id, startOptions), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    // Read the response body as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer()
    const combinedBuffer = Buffer.from(arrayBuffer)

    let stdout = ""
    let stderr = ""

    if (options.tty) {
      // When TTY is enabled, Docker multiplexing headers are not included
      stdout = combinedBuffer.toString()
    } else {
      // Demultiplex the Docker stream: 8-byte header per frame
      let offset = 0
      while (offset + 8 <= combinedBuffer.length) {
        const streamType = combinedBuffer.readUInt8(offset)
        const frameSize = combinedBuffer.readUInt32BE(offset + 4)

        if (offset + 8 + frameSize > combinedBuffer.length) break

        const frameData = combinedBuffer.subarray(offset + 8, offset + 8 + frameSize)

        if (streamType === 1) {
          stdout += frameData.toString()
        } else if (streamType === 2) {
          stderr += frameData.toString()
        }

        offset += 8 + frameSize
      }
    }

    // Get the exit code from inspect
    const inspectResult = await docker.containers.execInspect(execResult.Id)

    return {
      exitCode: inspectResult.ExitCode ?? 0,
      stderr: stderr.trim(),
      stdout: stdout.trim(),
    }
  }
}

export default Containers
