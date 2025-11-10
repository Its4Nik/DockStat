import type { PluginMetaType } from '@dockstat/typings/types'
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

export function RepoPluginSlide({ plugins }: RepoPluginSlideProps) {
	const [showModal, setShowModal] = useState('')

	return (
		<Card variant="flat" size="sm">
			<CardHeader className="text-md font-semibold">Plugins</CardHeader>

			<CardBody>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{plugins.map((plugin) => (
						<Card
							key={plugin.name}
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
									{(plugin?.tags || []).map((tag) => (
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
								<Button variant="primary" size="sm" className="w-full mt-2">
									Install
								</Button>
							</CardBody>
						</Card>
					))}
				</div>
			</CardBody>
		</Card>
	)
}
