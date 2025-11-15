import { Card, CardBody, CardFooter, CardHeader } from '@dockstat/ui'
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

	return (
		<Card>
			<CardHeader>Plugins</CardHeader>
			<CardBody>{JSON.stringify(status)}</CardBody>
			<CardFooter>{JSON.stringify(installedPlugins)}</CardFooter>
		</Card>
	)
}
