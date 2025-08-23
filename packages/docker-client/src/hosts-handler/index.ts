import { type DB, column } from '@dockstat/sqlite-wrapper'
import type { DATABASE } from '@dockstat/typings'

export default class HostHandler {
  protected hostTable

  constructor(hostDB: DB) {
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
    return this.hostTable.insert(host)
  }

  public getHosts() {
    return this.hostTable.all()
  }

  public removeHost(host: DATABASE.DB_target_host) {
    this.hostTable.where({ id: host.id }).delete()
  }

  public updateHost(host: DATABASE.DB_target_host) {
    this.hostTable.where({ id: host.id }).update(host)
  }
}
