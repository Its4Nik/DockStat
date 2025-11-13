import type {
	DBPluginShemaT,
	PluginMetaType,
} from '@dockstat/typings/types'
import { useFetcher } from 'react-router'
import {
	Card,
	CardBody,
	CardFooter,
	CardHeader,
} from '../../Card/Card'
import { Badge } from '../../Badge/Badge'
import { Modal } from '../../Modal/Modal'
import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from '../../Button/Button'
import { LinkWithIcon } from '../../Link/Link'

type RepoPluginSlideProps = {
	plugins: PluginMetaType[]
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

function PluginCard({
	plugin,
	showModal,
	setShowModal,
}: {
	plugin: PluginMetaType
	showModal: string
	setShowModal: (id: string) => void
}) {
	const [pluginObject, setPluginObject] =
		useState<Omit<DBPluginShemaT, 'id'> | null>(null)

	const fetcher = useFetcher<{
		success: boolean
		message?: string
		error?: string
	}>()

	useEffect(() => {
		const getPluginBundle = async () => {
			return await (
				await fetch(
					`http://localhost:5173/api/extensions/proxy/plugin/bundle/${plugin.repoType.trim()}`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							path: `${plugin.repository}/${plugin.manifest.replace(
								'/manifest.yml',
								'/bundle/index.js'
							)}`,
						}),
					}
				)
			).text()
		}

		getPluginBundle().then((d) => {
			const pluginObject: Omit<DBPluginShemaT, 'id'> = {
				...plugin,
				plugin: String(d),
			}
			setPluginObject(pluginObject)
		})
	}, [])

	const installing = fetcher.state !== 'idle'
	const id = `${plugin.name}-${plugin.repository}`

	const hasCorrectPluginData =
		pluginObject && pluginObject.plugin !== 'Not Found'

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
							onClick={() => setShowModal(id)}
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
					{!hasCorrectPluginData && (
						<Badge variant="error" size="sm">
							No Data for this Plugin received
						</Badge>
					)}
				</div>
			</CardHeader>

			<Modal open={showModal === id} onClose={() => setShowModal('')}>
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

				{/* Use fetcher.Form here so that navigation doesn’t change */}
				<fetcher.Form
					method="post"
					action={`/api/plugins/install`}
				>
					<input
						type="hidden"
						name="pluginObject"
						value={JSON.stringify(pluginObject)}
					/>
					<Button
						fullWidth
						type="submit"
						disabled={installing ? true : !hasCorrectPluginData}
						variant={installing ? 'outline' : 'primary'}
					>
						{installing ? 'Installing...' : 'Install'}
					</Button>
				</fetcher.Form>
			</CardBody>

			{fetcher.data ? (
				<CardFooter>
					<div>
						{fetcher.data.success
							? `✅ ${fetcher.data.message ?? 'Installed'}`
							: `❌ ${fetcher.data.error ?? 'Failed to install'} - ${JSON.stringify(fetcher.data.error)}`}
					</div>
				</CardFooter>
			) : null}
		</Card>
	)
}
