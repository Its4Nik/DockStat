import { OidcClient } from "elysia-openid-client"
import { DockStatDB } from "../database"
import BaseLogger from "../logger"

export class AuthHandler {
  private table = DockStatDB.authTable
  private logger = BaseLogger.spawn("Auth")

  createApiKey(name: string) {
    this.logger.info(`Creating API Key ${name}`)
    const token = `DAPI-${Bun.randomUUIDv7("base64")}`
    return this.table.insertAndGet({ name, token, type: "api-key" })
  }

  createUser(name: string, password: string) {
    this.logger.info(`Creating user ${name}`)
    return this.table.insertAndGet({ name, pass: password, type: "user" })
  }

  createOIDCTarget() {
    this.logger.info(`Creating OIDC Target `)
  }
}
