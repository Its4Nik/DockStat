import Elysia from 'elysia'
import {
	DockStatConfigTable,
	UpdateDockStatConfigTableResponse,
} from '@dockstat/typings/schemas'
import { DockStatDB } from '~/.server/db'

const DatabaseElysiaInstance = new Elysia({
	prefix: '/db',
	detail: { tags: ['DB'] },
})
	.post(
		'/dockstat-config',
		({ body }) => {
			const updateRes = DockStatDB.configTable
				.where({ id: 0 })
				.update(body)
			const newConfig = DockStatDB.configTable
				.select(['*'])
				.where({ id: 0 })
				.get()
			return {
				message: 'Updated config successfully',
				code: 200,
				update_response: updateRes,
				new_config: newConfig,
			}
		},
		{
			body: DockStatConfigTable,
			response: UpdateDockStatConfigTableResponse,
		}
	)
	.get('/dockstat-config', () => {
		const data = DockStatDB.configTable
			.select(['*'])
			.where({ id: 0 })
			.get()

		if (!data) {
			throw new Error('No Config found!')
		}

		return {
			message: 'Received DockStat config',
			code: 200,
			config: data,
		}
	})

export default DatabaseElysiaInstance
