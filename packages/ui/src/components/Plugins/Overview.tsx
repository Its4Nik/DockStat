import { Card, CardBody, CardHeader } from '@dockstat/ui'

interface PluginsOverviewCardProps {
	pluginCount: number
	repoCount: number
	loadedPluginsCount: number
}

export function PluginsOverviewCard({
	pluginCount,
	repoCount,
	loadedPluginsCount,
}: PluginsOverviewCardProps) {
	const stats = [
		{ label: 'Installed Plugins', value: pluginCount },
		{ label: 'Active Repositories', value: repoCount },
		{ label: 'Loaded Plugins', value: loadedPluginsCount },
	]

	return (
		<Card>
			<CardHeader className="text-xl font-semibold">
				Plugins Overview
			</CardHeader>
			<CardBody>
				<div className="flex flex-row gap-4">
					{stats.map((stat) => (
						<Card
							key={stat.label}
							size="sm"
							variant="flat"
							hoverable
							className="text-center"
						>
							<CardHeader className="text-lg font-medium">
								{stat.label}
							</CardHeader>
							<CardBody className="py-2">
								<span className="text-3xl font-bold text-primary-600">
									{stat.value}
								</span>
							</CardBody>
						</Card>
					))}
				</div>
			</CardBody>
		</Card>
	)
}
