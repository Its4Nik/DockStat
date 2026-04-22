import type Logger from "@dockstat/logger"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import * as client from "openid-client"
import type { ProvidersTable } from "./types"
import crypt from "./utils/encrypt"
import { BASE_URL } from "./utils/env"

export class ConfigService {
  table: QueryBuilder<ProvidersTable>
  logger: Logger
  issuerCache = new Map<string, client.Configuration>()

  constructor(table: QueryBuilder<ProvidersTable>, logger: Logger) {
    this.table = table
    this.logger = logger.spawn("ConfigService")
  }

  async getConfig(providerId: string) {
    const row = this.table
      .select(["issuer_url", "client_id", "client_secret", "scopes"])
      .where({ id: providerId })
      .first()

    if (!row) throw new Error(`Provider ${providerId} not found!`)

    this.logger.info(`=== OAuth Config for provider ${providerId} ===`)
    this.logger.info(`BASE_URL: ${BASE_URL}`)
    this.logger.info(`Issuer URL: ${row.issuer_url}`)
    this.logger.info(`Client ID: ${row.client_id}`)
    this.logger.info(`Client Secret: ${row.client_secret ? "[REDACTED]" : "NOT SET"}`)
    this.logger.info(`Scopes: ${row.scopes}`)

    let meta = this.issuerCache.get(row.issuer_url)

    if (!meta) {
      this.logger.info(`Discovering OIDC configuration from issuer...`)
      meta = await client.discovery(new URL(row.issuer_url), row.client_id, row.client_secret)
      this.issuerCache.set(row.issuer_url, meta)
      this.logger.info(
        `OIDC discovery complete. Token endpoint: ${meta.serverMetadata().token_endpoint}`
      )
    } else {
      this.logger.info(`Using cached OIDC configuration`)
    }

    const redirectUri = `${BASE_URL}/${providerId}/callback`
    this.logger.info(`Redirect URI: ${redirectUri}`)

    const config = {
      client_id: row.client_id,
      client_secret: await crypt.decrypt(row.client_secret),
      redirect_uris: [redirectUri],
      response_types: ["code"],
    } satisfies client.ClientMetadata

    this.logger.info(`Client config redirect_uris: ${JSON.stringify(config.redirect_uris)}`)
    this.logger.info(`=== End OAuth Config ===`)

    return { config, meta, scopes: row.scopes }
  }
}
