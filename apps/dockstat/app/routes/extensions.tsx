import { ExtensionBrowser } from "@dockstat/ui"
import { ExtensionLoader } from "@ServerLoaders/extensions"
import { useLoaderData } from "react-router"

export const loader = ExtensionLoader

export default function Extensions() {
	const data = useLoaderData<typeof loader>()

	return (
		<ExtensionBrowser
			allowUntrustedRepo={data.allow_untrusted_repo}
			installedPlugins={data.installedPlugins}
			repos={data.repos}
			manifests={data.repoManifests}
		/>
	)
}
