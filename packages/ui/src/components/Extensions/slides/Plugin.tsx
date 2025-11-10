import type {
	DBPluginShemaT,
	PluginMetaType,
} from '@dockstat/typings/types'
import { http } from '@dockstat/utils'
import { Form, useFetcher } from 'react-router'
import { Card, CardBody, CardHeader } from '../../Card/Card'
import { Badge } from '../../Badge/Badge'
import { Modal } from '../../Modal/Modal'
import { useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from '../../Button/Button'
import { LinkWithIcon } from '../../Link/Link'

type RepoPluginSlideProps = {
	plugins: PluginMetaType[]
}

async function getPluginData(
	PluginMeta: PluginMetaType
): Promise<DBPluginShemaT> {
	const pluginBundle = `http://localhost:3000/api/extensions/proxy/true/${PluginMeta.repoType}/${PluginMeta.repository}/${PluginMeta.manifest.replace('/manifest.yml', '/bundle/index.js')}`
	return {
		id: 0,
		...PluginMeta,
		plugin: await (
			await fetch(pluginBundle, {
				method: 'GET',
				headers: {
					'x-dockstatapi-requestid': http.requestId.getRequestID(
						true,
						false
					),
				},
			})
		).text(),
	}
}

export function RepoPluginSlide({ plugins }: RepoPluginSlideProps) {
	const [showModal, setShowModal] = useState<string>('')

	return (
		<Card variant="flat" size="sm">
			<CardHeader className="text-md font-semibold">Plugins</CardHeader>
			<CardBody>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{plugins.map((plugin) => (
						<PluginCard
							key={plugin.name}
							plugin={plugin}
							showModal={showModal}
							setShowModal={setShowModal}
						/>
					))}
				</div>
			</CardBody>
		</Card>
	)
}

async function PluginCard({
	plugin,
	showModal,
	setShowModal,
}: {
	plugin: PluginMetaType
	showModal: string
	setShowModal: (id: string) => void
}) {
	const fetcher = useFetcher()
	const busy = fetcher.state !== 'idle'

	return (
		<Card
			size="sm"
			variant="elevated"
			className="flex flex-col justify-between"
		>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<LinkWithIcon
							href={`/api/extensions/proxy/plugins/${plugin.repoType}/${plugin.repository}/${plugin.manifest}`}
							external
						>
							{plugin.name}
						</LinkWithIcon>
						<Button
							className="p-0 w-4 h-4 ml-2"
							size="sm"
							variant="ghost"
							onClick={() =>
								setShowModal(`${plugin.name}-${plugin.repository}`)
							}
						>
							<Info className="w-3 h-3" />
						</Button>
					</div>
					<span className="text-xs text-muted-text font-bold">
						{plugin.version}
					</span>
				</div>

				<div className="mt-2 flex flex-wrap gap-1">
					{(plugin.tags || []).map((tag) => (
						<Badge key={tag} unique size="sm">
							{tag}
						</Badge>
					))}
				</div>
			</CardHeader>

			<Modal
				open={showModal === `${plugin.name}-${plugin.repository}`}
				onClose={() => setShowModal('')}
			>
				<ul className="mt-2 space-y-1">
					{plugin.repository && (
						<li>
							<strong>Repo:</strong> {plugin.repository}
						</li>
					)}
					{plugin.manifest && (
						<li>
							<strong>Manifest:</strong> {plugin.manifest}
						</li>
					)}
					{plugin.author.name && (
						<li>
							<strong>Author:</strong> {plugin.author.name}
						</li>
					)}
					{plugin.author.email && (
						<li>
							<strong>Email:</strong> {plugin.author.email}
						</li>
					)}
					{plugin.author.website && (
						<li>
							<strong>Website:</strong>{' '}
							<a
								href={plugin.author.website}
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								{plugin.author.website}
							</a>
						</li>
					)}
					{plugin.author.license && (
						<li>
							<strong>License:</strong> {plugin.author.license}
						</li>
					)}
				</ul>
			</Modal>

			<CardBody className="max-w-80 space-y-1 text-sm text-muted-text">
				<Card size="sm" variant="outlined" hoverable={false}>
					{plugin.description && (
						<p className="text-foreground">{plugin.description}</p>
					)}
				</Card>

				<fetcher.Form action="/extensions">
					<input type="hidden" name="action" value="install" />
					<input
						type="text"
						name="pluginManifest"
						value={JSON.stringify(await getPluginData(plugin))}
					/>
					<p>{JSON.stringify(await getPluginData(plugin))}</p>
					<Button
						type="submit"
						variant={fetcher.data?.error ? 'danger' : 'primary'}
						size="sm"
						className="w-full mt-2"
						disabled={busy || fetcher.data?.error}
					>
						{busy ? 'Installing...' : 'Install'}
					</Button>
				</fetcher.Form>

				{fetcher.data?.error ? (
					<Card size="sm" variant="outlined">
						{JSON.stringify(fetcher.data.error)}
					</Card>
				) : null}
			</CardBody>
		</Card>
	)
}
