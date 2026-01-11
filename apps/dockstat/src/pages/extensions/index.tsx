import { Card } from "@dockstat/ui"
import { Plus } from "lucide-react"
import { RepoCard } from "@/components/extensions/RepoCard"
import { useEdenMutation } from "@/hooks/useEdenMutation"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

export default function ExtensionsIndex() {
  usePageHeading("Repositories")

  const { data } = useEdenQuery({
    queryKey: ["fetchAllRepositories"],
    route: api.repositories.all.get,
  })

  const _addRepoMutation = useEdenMutation({
    route: api.db.repositories.post,
    mutationKey: ["addRepo"],
    invalidateQueries: [["fetchAllRepositories"]],
    toast: {
      errorTitle: (repo) => `Could not add ${repo.name}`,
      successTitle: (repo) => `Added ${repo.name}`,
    },
  })

  return (
    <div className="flex">
      {data?.map((repo) => (
        <RepoCard
          key={repo.id}
          id={repo.id}
          name={repo.name}
          policy={repo.policy}
          type={repo.type}
          source={repo.source}
          verification_api={repo.verification_api}
        />
      ))}

      <div className="flex-1">
        <Card variant="outlined" className="border-dashed">
          <div className="flex justify-between text-center">
            <div>
              <Plus className="border border-accent/80 p-1 border-dotted rounded-md" size={40} />
            </div>
            <div className="flex flex-wrap max-w-[50%]"></div>
          </div>
        </Card>
      </div>
    </div>
  )
}
