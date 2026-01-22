/*
  Stacks are deployed like the following:

  ./stacks
    -/:id/
      - .env
      - docker-compose.yaml
      - README.md

*/

import { column } from "@dockstat/sqlite-wrapper"
import * as DC from "docker-compose"
import { DockNodeDB } from "../db"

const STACK_ROOT = "./stacks"

class StackHandler {
  private table = DockNodeDB.createTable<{
    id: number
    name: string
    version: string
    repository: string
    readMePath: string
    stack: string // The name of the Stack in the Repo
    yaml: string // Actual docker compose yaml
    env: Record<string, string | number | boolean | null | undefined>
  }>("stacks", {
    id: column.id(),
    name: column.text(),
    readMePath: column.text(),
    repository: column.text(),
    stack: column.text(),
    version: column.text(),
    yaml: column.text(),
    env: column.json(),
  })

  async createStack(
    name: string,
    yaml: string,
    repository: string,
    ogName: string,
    version: string,
    readMePath: string,
    env: Record<string, string | number | boolean | null | undefined>
  ) {
    const insertRes = this.table.insert({
      name: name,
      repository: repository,
      stack: ogName,
      readMePath: readMePath,
      version: version,
      yaml: yaml,
    })

    const id = insertRes.insertId

    await this.writeReadMe(id, readMePath)
    await this.writeEnv(id, env)
    await this.writeCompose(id, yaml, version, repository)
  }

  private async writeCompose(id: number, yaml: string, version: string, repository: string) {
    const content = `
# Stack ID: ${id}
# Version: ${version}
# Repository: ${repository}

${yaml}`

    return await Bun.write(`${STACK_ROOT}/${id}/docker-compose.yaml`, content, { createPath: true })
  }

  private async writeEnv(
    id: number,
    env: Record<string, string | number | boolean | null | undefined>
  ) {
    const content = Object.entries(env)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join("\n")

    return await Bun.write(`${STACK_ROOT}/${id}/.env`, content, {
      createPath: true,
    })
  }

  private async writeReadMe(id: number, readeMePath: string) {
    const url = new URL(readeMePath)
    const readmeData = await (await fetch(url, { method: "GET" })).text()

    return await Bun.write(`${STACK_ROOT}/${id}/README.md`, readmeData, {
      createPath: true,
    })
  }

  // ----

  async startStack(id: number) {
    const data = this.table.select(["env"]).where({ id: id }).first()
    await DC.upAll({ env: data?.env as Dict<string> | undefined })
  }
}
