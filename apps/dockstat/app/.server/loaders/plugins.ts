import { DockStatDB } from '../db'
import { api } from '../treaty'

export async function PluginsLoader() {
	const installedPlugins = await api.plugins.all.get()
	const status = await api.plugins.status.get()
	const t = await DockStatDB._sqliteWrapper.getDb()

	if (installedPlugins.error) {
		return { error: installedPlugins.error }
	}

	if (status.error) {
		return { error: status.error }
	}

	return {
		status: status.data,
		installedPlugins: installedPlugins.data,
	}
}
