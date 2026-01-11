import type { RepoType } from "@dockstat/typings/types"
import { Button, Card, CardHeader, LinkWithIcon, RepoIcons } from "@dockstat/ui"
import { repo } from "@dockstat/utils"
import { ShieldMinus, ShieldPlus, ShieldX, Trash2 } from "lucide-react"
import { useEdenMutation } from "@/hooks/useEdenMutation"
import { api } from "@/lib/api"

export function RepoCard({ id, name, policy, source, type, verification_api }: RepoType) {
  const deleteRepoMutation = useEdenMutation({
    route: api.db.repositories({ id: id }).delete,
    mutationKey: ["addRepo"],
    invalidateQueries: [["fetchAllRepositories"]],
    toast: { errorTitle: "Could not delete Repo", successTitle: "Deleted Repo" },
  })

  const handleDelete = () => deleteRepoMutation.mutateAsync()

  return (
    <div className="flex-1">
      <Card variant="flat">
        <CardHeader size="sm" className="flex justify-between">
          <span className="text-primary-text text-2xl">{name}</span>
          <div className="flex flex-row space-x-2">
            {verification_api ? (
              policy === "relaxed" ? (
                <ShieldMinus className="text-badge-warning-bg my-auto" />
              ) : (
                <ShieldPlus className="text-success my-auto" />
              )
            ) : (
              <ShieldX className="text-muted-text my-auto" />
            )}

            <LinkWithIcon
              icon={<RepoIcons type={type} />}
              className="my-auto"
              href={repo.parseFromDBToRepoLink(type, source, "README.md", false)}
            />

            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={20} />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
