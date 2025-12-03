import { Card, Table } from "@dockstat/ui"

export default function Index() {
	return (
		<Card
			size="sm"
			variant="flat"
			className="w-[95vw] mx-auto flex flex-row gap-4"
		>
			<Card variant="elevated" size="sm">
				Docker Clients
			</Card>
			<Card variant="elevated" size="sm">
				Docker Hosts
			</Card>
			<Card variant="elevated" size="sm">
				Docker Containers
			</Card>
			<Card variant="elevated" size="sm">
				Plugins
			</Card>
			<Card variant="elevated" size="sm">
				Themes
			</Card>
			<Card variant="elevated" size="sm">
				Stacks
			</Card>
			<Card variant="elevated" size="sm">
				Nodes
			</Card>
			<Card variant="elevated" size="sm">
				Metrics
			</Card>
			<Card variant="elevated" size="sm">
				Config
			</Card>
			<Card variant="elevated" size="sm">
				Extensions
			</Card>
		</Card>
	)
}
