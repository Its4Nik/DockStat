import Logger from '@dockstat/logger'
import { type DB, column } from '@dockstat/sqlite-wrapper'
import type { DATABASE } from '@dockstat/typings'

export default class HostHandler {
	private logger
	protected hostTable

	constructor(id: number, hostDB: DB) {
		this.logger = new Logger(`HostHandler-${id}`)
		this.logger.info('Initializing HostHandler')
		this.logger.debug('Creating hosts table')
		this.hostTable = hostDB.createTable<DATABASE.DB_target_host>(
			`HostHandler-${id}`,
			{
				id: column.id(),
				name: column.text({ notNull: true }),
				host: column.text({ notNull: true }),
				port: column.integer({ notNull: true }),
				secure: column.boolean({ default: 0 }),
				createdAt: column.createdAt(),
				updatedAt: column.updatedAt(),
			},
			{ ifNotExists: true }
		)
	}

	public addHost(host: Partial<DATABASE.DB_target_host>): number {
		const prev = this.getHosts().map((h) => h.id)

		this.logger.info(
			`Adding new host: ${host.name} (${host.host}:${host.port})`
		)

		this.hostTable.insertOrFail(host)

		const now = this.getHosts()
		const newHost = now.find(
			(h) => !prev.includes(h.id)
		) as DATABASE.DB_target_host

		return newHost.id
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
