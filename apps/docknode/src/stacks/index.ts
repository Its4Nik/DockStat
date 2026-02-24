import { column } from "@dockstat/sqlite-wrapper"
import * as DC from "docker-compose"
import type { IDockerComposeOptions } from "docker-compose"
import { DockNodeDB } from "../db"
import { DockNodeLogger } from "./../utils/logger"
import type { EnvMap, CreateStackInput, DeleteStackOptions, Stack, UpdateStackInput } from "./types"
import { extractErrorMessage, omit } from "@dockstat/utils"
import { DOCKER_BIN, DOCKER_SOCKET_PATH } from "../consts"
import Client from "../docker-client"
import type {ComposeSpecification, Service} from "@dockstat/typings/"
import { YAML } from "bun"
import { addLabel, hasLabel, normalizeEnv } from "./utils"
const logger = DockNodeLogger.spawn("Stacks")
const progressLogger = logger.spawn("Progress")

const STACK_ROOT = "./stacks"

const getStackOptions = (id: number): IDockerComposeOptions => ({
  cwd: `${STACK_ROOT}/${id}`,
  executable: { executablePath: DOCKER_BIN },
  env: {
    DOCKER_HOST: DOCKER_SOCKET_PATH
  },
  log: false,
  callback: (chunk: Buffer) => {
    progressLogger.debug(chunk.toString())
  },
})

const serializeEnv = (env: EnvMap): string =>
  Object.entries(env)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join("\n")

const parseEnv = (content: string): EnvMap =>
  content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=")
      if (!key || !rest.length) return acc

      const raw = rest.join("=")
      acc[key] =
        raw === "true"
          ? true
          : raw === "false"
            ? false
            : raw === "null"
              ? null
              : Number.isNaN(Number(raw))
                ? raw
                : Number(raw)

      return acc
    }, {} as EnvMap)

// ---- Stack Handler Class

class StackHandler {
  private table = DockNodeDB.createTable<Stack>(
    "stacks",
    {
      id: column.id(),
      name: column.text(),
      repository: column.text(),
      stack: column.text(),
      version: column.text(),
      yaml: column.text(),
      env: column.json(),
    },
    {
      ifNotExists: true,
    }
  )

  // ---- Logging

  private log(action: string, details?: unknown) {
    if (details === undefined) {
      logger.debug(action)
    } else {
      logger.debug(`${action} :: ${JSON.stringify(details)}`)
    }
  }

  // ---- Docker Compose Wrapper

  private async execDC<T>(
    action: string,
    id: number,
    fn: (options: IDockerComposeOptions) => Promise<T>
  ): Promise<T> {
    this.log(action, { id })
    return fn(getStackOptions(id))
  }

  // ---- Metadata
  private checkYaml(yaml: string, stackId: number) {
    this.log("checkingYAML", { stackId })
    try {
      let compose: ComposeSpecification = YAML.parse(yaml) as ComposeSpecification

      compose = this.checkLabels(compose, stackId)
      compose = this.checkEnv(compose)

      return compose

    } catch (error) {
      logger.error(extractErrorMessage(error))
      throw error
    }
  }

  private checkEnv(compose: ComposeSpecification) {
    const services = Object.entries(compose.services || {})
    const parsedServices: { [k: string]: Service; } = {}
    for (const [key, service] of services) {
      const norm = normalizeEnv(service.environment)
      parsedServices[key] = {...service, environment: norm}
    }

    return {...compose, services: parsedServices}
  }

  private checkLabels(compose: ComposeSpecification, stackId: number): ComposeSpecification {
    try {
    const services = compose.services
    const parsedServices: { [k: string]: Service; } = {}

    for (const [key, dat] of Object.entries(services || {})) {
      if (!hasLabel(dat.labels, "com.docknode.dockstack.id")) {
        dat.labels = addLabel(dat.labels, "com.docknode.dockstack.id", stackId)
      }
      parsedServices[key] = dat
    }

    return {...compose, services: parsedServices}
    } catch (error){
      logger.error(extractErrorMessage(error))
      throw error
    }
  }

  // ---- File Operations

  private async writeCompose(id: number, yaml: string, version: string, repository: string) {
    try {
      this.log("writeCompose", { id })
      const checkedYaml = YAML.stringify(this.checkYaml(yaml, id), null, 2)

      const content = `# Stack ID: ${id}
# Version: ${version}
# Repository: ${repository}

${checkedYaml}`

      await Bun.write(`${STACK_ROOT}/${id}/docker-compose.yaml`, content, {
        createPath: true,
      })
      return true
    }
    catch (error) {
      logger.error(extractErrorMessage(error))
return false
    }
  }

  private async writeEnv(id: number, env: EnvMap) {
    try {
      this.log("writeEnv", { id })
      await Bun.write(`${STACK_ROOT}/${id}/.env`, serializeEnv(env), {
        createPath: true,
      })
      return true
    } catch (error) {
      logger.error(extractErrorMessage(error))
      return false
    }
  }

  private async readEnv(id: number): Promise<EnvMap> {
    this.log("readEnv", { id })
    const text = await Bun.file(`${STACK_ROOT}/${id}/.env`).text()
    return parseEnv(text)
  }

  // ---- Database Queries

  private getStackOrThrow(id: number): Stack {
    const stack = this.table.select(["*"]).where({ id }).first()
    if (!stack) throw new Error(`Stack ${id} not found`)
    return stack
  }

  private updateMeta(
    id: number,
    data: Partial<Pick<Stack, "name" | "repository" | "stack" | "version">>
  ) {
    this.log("updateMeta", { id, data })
    return this.table.where({ id }).update(data)
  }

  // ---- Public API: CRUD Operations

  async createStack(input: CreateStackInput) {
    this.log("createStack:start", { name: input.name })

    const { insertId } = this.table.insert({
      name: input.name,
      repository: input.repository,
      stack: input.repoName,
      version: input.version,
      yaml: YAML.stringify(this.checkEnv(YAML.parse(input.yaml)as ComposeSpecification), null, 2),
      env: input.env,
    })

    const isErrored = (healthy: boolean) => {
      if (!healthy) {
        const msg = `Stack creation of ${input.name} / ${insertId} failed - deleting stack from DB`
        logger.info(msg)
        this.table.where({ id: insertId }).delete()
        throw new Error(msg)
      }
    }
    try {

    isErrored(await this.writeCompose(insertId, input.yaml, input.version, input.repository))

    isErrored(await this.writeEnv(insertId, input.env))

    this.log("createStack:done", { id: insertId })
    return {success: true, message: "Stack created successfully", stackId: insertId}
    } catch (error) {
      logger.error(extractErrorMessage(error))
      return { message: extractErrorMessage(error) , success: false}
    }
  }

  async getStack(id: number): Promise<Stack | null> {
    this.log("getStack", { id })
    return this.table.select(["*"]).where({ id }).first() || null
  }

  async listStacks(): Promise<Stack[]> {
    this.log("listStacks")
    return this.table.select(["*"]).all()
  }

  async updateStack(id: number, data: UpdateStackInput) {
    this.log("updateStack:start", { id, keys: Object.keys(data) })

    const stack = this.getStackOrThrow(id)

    if (data.yaml) {
      this.table.where({ id }).update({ yaml: data.yaml })
      await this.writeCompose(id, data.yaml, stack.version, stack.repository)
    }

    if (data.env) {
      const current = await this.readEnv(id)
      const merged = { ...current, ...data.env }
      await this.writeEnv(id, merged)
    }

    if (data.version) {
      this.updateMeta(id, { version: data.version })
      await this.writeCompose(id, stack.yaml, data.version, stack.repository)
    }

    this.log("updateStack:done", { id })
  }

  async renameStack(id: number, name: string) {
    this.log("renameStack", { id, name })
    return this.updateMeta(id, { name })
  }

  async deleteStack(id: number, options: DeleteStackOptions = { removeFiles: true }) {
    this.log("deleteStack:start", { id, options })

    const stack = await this.getStack(id)
    if (!stack) {
      this.log("deleteStack:not-found", { id })
      return false
    }

    this.table.where({ id }).delete()

    if (options.removeFiles) {
      const path = `${STACK_ROOT}/${id}`
      try {
        await Bun.$`rm -rf ${path}`
        this.log("deleteStack:files-removed", { id })
      } catch {
        this.log("deleteStack:file-remove-failed", { id })
      }
    }

    this.log("deleteStack:done", { id })
    return true
  }

  async exportStack(id: number) {
    this.log("exportStack", { id })
    const stack = this.getStackOrThrow(id)
    const env = await this.readEnv(id)
    return { stack: omit(stack as unknown as Record<PropertyKey, unknown>, ["env"]), env }
  }

  // ---- Public API: Docker Compose Commands

  async up(id: number, services?: string[]) {
    if (services && services.length > 0) {
      return this.execDC("upMany", id, (opts) => DC.upMany(services, opts))
    }
    return this.execDC("upAll", id, DC.upAll)
  }

  async down(id: number, options?: { volumes?: boolean; removeOrphans?: boolean }) {
    return this.execDC("down", id, (opts) =>
      DC.down({
        ...opts,
        commandOptions: [
          ...(options?.volumes ? ["--volumes"] : []),
          ...(options?.removeOrphans ? ["--remove-orphans"] : []),
        ],
      })
    )
  }

  async stop(id: number, services?: string[]) {
    if (services && services.length > 0) {
      return this.execDC("stopMany", id, (opts) => DC.stopMany(opts, ...services))
    }
    return this.execDC("stopAll", id, DC.stop)
  }

  async restart(id: number, services?: string[]) {
    if (services && services.length > 0) {
      return this.execDC("restartMany", id, (opts) => DC.restartMany(services, opts))
    }
    return this.execDC("restartAll", id, DC.restartAll)
  }

  async pull(id: number, services?: string[]) {
    if (services && services.length > 0) {
      return this.execDC("pullMany", id, (opts) => DC.pullMany(services, opts))
    }
    return this.execDC("pullAll", id, DC.pullAll)
  }

  async ps(id: number) {
    return this.execDC("ps", id, DC.ps)
  }

  async logs(id: number, services?: string[], options?: { follow?: boolean; tail?: number }) {
    return this.execDC("logs", id, (opts) =>
      DC.logs(services || [], {
        ...opts,
        commandOptions: [
          ...(options?.follow ? ["--follow"] : []),
          ...(options?.tail ? ["--tail", String(options.tail)] : []),
        ],
      })
    )
  }

  async exec(id: number, service: string, command: string | string[]) {
    return this.execDC("exec", id, (opts) => DC.exec(service, command, opts))
  }

  async run(id: number, service: string, command: string | string[], options?: { rm?: boolean }) {
    return this.execDC("run", id, (opts) =>
      DC.run(service, command, {
        ...opts,
        commandOptions: [...(options?.rm ? ["--rm"] : [])],
      })
    )
  }

  async rm(id: number, services?: string[], options?: { force?: boolean; volumes?: boolean }) {
    return this.execDC("rm", id, (opts) =>
      DC.rm(
        {
          ...opts,
          commandOptions: [
            ...(options?.force ? ["--force"] : []),
            ...(options?.volumes ? ["--volumes"] : []),
          ],
        },
        ...(services || [])
      )
    )
  }

  async kill(id: number, signal: string = "SIGKILL") {
    return this.execDC("kill", id, (opts) =>
      DC.kill({
        ...opts,
        commandOptions: [["--signal", signal]],
      })
    )
  }

  async port(id: number, service: string, containerPort: number, options?: { protocol?: string }) {
    return this.execDC("port", id, (opts) =>
      DC.port(service, containerPort, {
        ...opts,
        commandOptions: [...(options?.protocol ? ["--protocol", options.protocol] : [])],
      })
    )
  }

  async config(id: number, options?: { services?: boolean; volumes?: boolean }) {
    return this.execDC("config", id, (opts) =>
      DC.config({
        ...opts,
        commandOptions: [
          ...(options?.services ? ["--services"] : []),
          ...(options?.volumes ? ["--volumes"] : []),
        ],
      })
    )
  }

  async configServices(id: number) {
    return this.execDC("configServices", id, DC.configServices)
  }

  async configVolumes(id: number) {
    return this.execDC("configVolumes", id, DC.configVolumes)
  }

  async getNetworkStats() {
   return await Client.getNetworkStats()
  }

  async version() {
    const dat = omit(getStackOptions(0) as unknown as Record<PropertyKey, unknown>, ["cwd"])
    return DC.version({...dat, commandOptions: ["--short"] })
  }
}

export default StackHandler
