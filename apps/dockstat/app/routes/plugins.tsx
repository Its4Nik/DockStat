import { PluginsPage } from '@dockstat/ui'
import { PluginsLoader } from '@ServerLoaders/plugins'
import { useLoaderData } from 'react-router'
import { toast } from 'sonner'

export const loader = PluginsLoader

export default function Plugins() {
	const { installedPlugins, status, error } =
		useLoaderData<typeof loader>()

	if (error) {
		console.error(error.value)
		toast.error('Error loading data', {
			description: `The Backend responded with an Error Code of ${error.status} - Error value can be found in the Log`,
		})
	}

	const plugins = installedPlugins || []

	if (!status) {
		throw new Error('')
	}

	return <PluginsPage installedPlugins={plugins} status={status} />
}
