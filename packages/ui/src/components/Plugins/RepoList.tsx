import { Card, CardBody, CardHeader } from "@dockstat/ui"
import { Link } from "react-router"

interface RepositoriesListProps {
  repositories: string[]
}

export function RepositoriesList({ repositories }: RepositoriesListProps) {
  if (repositories.length === 0) return null

  return (
    <Card>
      <CardHeader className="text-xl font-semibold">Active Repositories</CardHeader>
      <CardBody>
        <div className="space-y-2">
          {repositories.map((repo) => (
            <Card key={repo} variant="outlined" size="sm">
              <Link target="_blank" to={`/api/extensions/proxy/false/github/${repo}`}>
                <span className="font-mono text-sm">{repo}</span>
              </Link>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
