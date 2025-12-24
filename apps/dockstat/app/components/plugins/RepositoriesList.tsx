import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { AnimatePresence } from "framer-motion"
import { Store } from "lucide-react"
import { RepositoryCard } from "./RepositoryCard"
import type { RepositoriesListProps } from "./types"

export function RepositoriesList({ repositories, pluginCountByRepo = {} }: RepositoriesListProps) {
  if (repositories.length === 0) {
    return (
      <Card variant="outlined" size="sm" className="w-full">
        <CardBody className="text-center text-muted-text py-12">
          <Store className="mx-auto mb-3 opacity-50" size={48} />
          <p className="text-lg font-medium">No repositories configured</p>
          <p className="text-sm mt-1">Add a repository to browse and install verified plugins</p>
        </CardBody>
      </Card>
    )
  }

  // Sort repositories: verified first, then by name
  const sortedRepositories = [...repositories].sort((a, b) => {
    if (a.isVerified !== b.isVerified) return b.isVerified ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  const verifiedCount = repositories.filter((r) => r.isVerified).length
  const strictCount = repositories.filter((r) => r.policy === "strict").length

  return (
    <Card variant="default" size="sm" className="w-full">
      <CardHeader className="text-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-accent" />
          <span>Plugin Repositories</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" rounded>
            {verifiedCount} verified
          </Badge>
          <Badge variant="warning" size="sm" rounded>
            {strictCount} strict
          </Badge>
          <Badge variant="secondary" size="sm" rounded>
            {repositories.length} total
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="p-4">
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {sortedRepositories.map((repository) => (
              <RepositoryCard
                key={repository.name}
                repository={repository}
                pluginCount={pluginCountByRepo[repository.name] || 0}
              />
            ))}
          </AnimatePresence>
        </div>
      </CardBody>
    </Card>
  )
}
