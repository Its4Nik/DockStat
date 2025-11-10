import type { DBPluginShemaT } from '@dockstat/typings/types'
import type { Route } from '@RR/routes/extensions'
import { api } from '../treaty'
import { logger } from '.'

export async function ExtensionActions({
	request,
}: Route.ActionArgs) {
	logger.debug('Parsing form Data')
	const formData = await request.formData()
	logger.debug('Parsing Plugin Manifest String to Object')
	const pluginManifest: DBPluginShemaT = JSON.parse(
		formData.get('pluginManifest')?.toString() || '{}'
	)
	const repoId = formData.get('repoId')?.toString()
	const action = formData.get('action')

	if (action === 'install') {
		logger.debug('Running install action')
		return await api.plugins.install.post(pluginManifest)
	}

	if (action === 'uninstall') {
		logger.debug('Running uninstall action')
		if (!repoId) {
			logger.error('No Repo ID for deletion provided!')
			return new Response('No Repository ID received', { status: 400 })
		}

		return await api.plugins.delete.post(Number(repoId))
	}

	logger.error(`Unkown action ${action}`)
	return new Response(`Unkown action ${action}`, { status: 400 })
}
