import type { DOCKER } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import type Dockerode from "dockerode"
import { DockerClientBase } from "../../mixins/core/base"
import {
  mapContainerInfo,
  mapContainerInfoFromInspect,
  mapContainerStats,
} from "../../utils/mapContainerInfo"

/**
 * Containers mixin: adds container listing, inspection, stats and lifecycle operations.
 *
 * Usage: compose with DockerClientBase via applyMixins alongside other mixins.
 */
export class Containers extends DockerClientBase {
  // ---------- Helpers ----------

  // ---------- Queries ----------

  public async getAllContainers(): Promise<DOCKER.ContainerInfo[]> {
    this.checkDisposed()

    const hosts = this.hostHandler.getHosts()
    this.logger.info(`Fetching containers from all hosts (${hosts.length})`)

    if (hosts.length === 0) {
      this.logger.debug("No hosts found")
      return []
    }

    const all: DOCKER.ContainerInfo[] = []
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

  public async getContainersForHost(hostId: number): Promise<DOCKER.ContainerInfo[]> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const containers = await retry(() => docker.listContainers({ all: true }), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    return containers.map((c) => mapContainerInfo(c, hostId))
  }

  public async getContainer(hostId: number, containerId: string): Promise<DOCKER.ContainerInfo> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    const info = await retry(() => container.inspect(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    return mapContainerInfoFromInspect(info, hostId)
  }

  public async getAllContainerStats(): Promise<DOCKER.ContainerStatsInfo[]> {
    this.checkDisposed()

    const hosts = this.hostHandler.getHosts()
    const allStats: DOCKER.ContainerStatsInfo[] = []

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

  public async getContainerStatsForHost(hostId: number): Promise<DOCKER.ContainerStatsInfo[]> {
    this.checkDisposed()

    const containers = await this.getContainersForHost(hostId)
    const running = containers.filter((c) => c.state === "running")

    const results = await Promise.allSettled(
      running.map((c) => this.getContainerStats(hostId, c.id))
    )

    const ok: DOCKER.ContainerStatsInfo[] = []
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

  public async getContainerStats(
    hostId: number,
    containerId: string
  ): Promise<DOCKER.ContainerStatsInfo> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    const [inspectInfo, stats] = await Promise.all([
      retry(() => container.inspect(), {
        attempts: this.options.retryAttempts,
        delay: this.options.retryDelay,
      }),
      retry(() => container.stats({ stream: false }) as Promise<Dockerode.ContainerStats>, {
        attempts: this.options.retryAttempts,
        delay: this.options.retryDelay,
      }),
    ])

    const mappedInfo = mapContainerInfoFromInspect(inspectInfo, hostId)
    return mapContainerStats(mappedInfo, stats)
  }

  // ---------- Lifecycle control ----------

  public async startContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    await retry(() => container.start(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async stopContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    await retry(() => container.stop(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async restartContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    await retry(() => container.restart(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async removeContainer(hostId: number, containerId: string, force = false): Promise<void> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    await retry(() => container.remove({ force }), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async pauseContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    await retry(() => container.pause(), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
  }

  public async unpauseContainer(hostId: number, containerId: string): Promise<void> {
    this.checkDisposed()

    const docker = this.getDockerInstance(hostId)
    const container = docker.getContainer(containerId)

    await retry(() => container.unpause(), {
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
    const container = docker.getContainer(containerId)

    await retry(() => container.kill({ signal }), {
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
    const container = docker.getContainer(containerId)

    await retry(() => container.rename({ name: newName }), {
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
    const container = docker.getContainer(containerId)

    const logOptions = {
      stdout: options.stdout ?? true,
      stderr: options.stderr ?? true,
      timestamps: options.timestamps ?? false,
      tail: options.tail ?? 100,
      ...options,
    }

    const logStream = await retry(() => container.logs(logOptions), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
    return logStream.toString()
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
    const container = docker.getContainer(containerId)

    const execOptions = {
      Cmd: command,
      AttachStdout: options.attachStdout ?? true,
      AttachStderr: options.attachStderr ?? true,
      Tty: options.tty ?? false,
      Env: options.env,
      WorkingDir: options.workingDir,
    }

    const exec = await retry(() => container.exec(execOptions), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    const stream = await retry(
      () =>
        exec.start({
          Detach: false,
          Tty: options.tty ?? false,
        }),
      {
        attempts: this.options.retryAttempts,
        delay: this.options.retryDelay,
      }
    )

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []

      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })

      stream.on("end", async () => {
        try {
          const combinedBuffer = Buffer.concat(chunks)
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

          const inspectResult = await exec.inspect()
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: inspectResult.ExitCode ?? 0,
          })
        } catch (error) {
          reject(error)
        }
      })

      stream.on("error", reject)

      // Failsafe timeout to avoid a hung stream
      setTimeout(() => reject(new Error("Exec operation timed out")), 30000)
    })
  }
}

export default Containers
