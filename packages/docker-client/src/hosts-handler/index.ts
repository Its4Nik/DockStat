import { createLogger } from '@dockstat/logger'
import { type DB, column } from '@dockstat/sqlite-wrapper'
import type { DATABASE } from '@dockstat/typings'

export default class HostHandler {
  private logger = createLogger('HostHandler')
  protected hostTable

  constructor(hostDB: DB) {
    this.logger.info('Initializing HostHandler')
    this.logger.debug('Creating hosts table')
    hostDB.createTable('hosts', {
      id: column.id(),
      name: column.text({ notNull: true }),
      host: column.text({ notNull: true }),
      port: column.integer({ notNull: true }),
      secure: column.boolean({ default: 0 }),
      createdAt: column.createdAt(),
      updatedAt: column.updatedAt(),
    })
    this.hostTable = hostDB.table<DATABASE.DB_target_host>('hosts')
  }

  public addHost(host: DATABASE.DB_target_host) {
    this.logger.info(
      `Adding new host: ${host.name} (${host.host}:${host.port})`
    )
    return this.hostTable.insert(host)
  }

  public getHosts() {
    this.logger.debug('Fetching all hosts')
    return this.hostTable.all()
  }

  public removeHost(host: DATABASE.DB_target_host) {
    this.logger.info(`Removing host: ${host.name} (ID: ${host.id})`)
    this.hostTable.where({ id: host.id }).delete()
  }

  public updateHost(host: DATABASE.DB_target_host) {
    this.logger.info(`Updating host: ${host.name} (ID: ${host.id})`)
    this.hostTable.where({ id: host.id }).update(host)
  }
}
