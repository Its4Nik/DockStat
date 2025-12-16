import type { DBPluginShemaT } from "@dockstat/typings/types"
import { Badge, Card, CardBody, CardFooter, CardHeader, LinkWithIcon } from "@dockstat/ui"

interface PluginCardProps {
  plugin: DBPluginShemaT
}

export function PluginCard({ plugin }: PluginCardProps) {
  return (
    <Card variant="outlined">
      <CardHeader className="flex items-center gap-3 pb-2">
        <h3 className="font-semibold text-primary-800 text-lg">{plugin.name}</h3>
        <Badge unique className="text-xs font-medium">
          v{plugin.version}
        </Badge>

        <Badge className="mr-0" variant="secondary" size={"sm"}>
          ID: {plugin.id}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-3">
        <Card size="sm" variant="elevated">
          <p>{plugin.description}</p>
        </Card>

        {plugin.tags && plugin.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plugin.tags.map((tag) => (
              <Badge key={tag} unique>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium">Author:</span> {plugin.author?.name}
          </div>
          <div>
            <span className="font-medium">License:</span> {plugin.author?.license}
          </div>
          <div>
            <span className="font-medium">Repository:</span> {plugin.repository}
          </div>
          <div>
            <span className="font-medium">Type:</span> {plugin.repoType}
          </div>
        </div>
      </CardBody>

      {plugin.author?.website && (
        <CardFooter>
          <LinkWithIcon
            href={plugin.author.website}
            className="text-primary-600 hover:text-primary-700"
          >
            Visit Author's Website →
          </LinkWithIcon>
        </CardFooter>
      )}
    </Card>
  )
}
