import { Button, Card, Input } from "@dockstat/ui"
import { Plus } from "lucide-react"
import { useState } from "react"
import { RepoCard } from "@/components/extensions/RepoCard"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

export default function ExtensionsIndex() {
  usePageHeading("Repositories")

  const [repoLink, setRepoLink] = useState("")

  const { data } = useEdenQuery({
    queryKey: ["fetchAllRepositories"],
    route: api.repositories.all.get,
  })

  const addRepoMutation = useEdenMutation({
    route: api.db.repositories.post,
    mutationKey: ["addRepo"],
    invalidateQueries: [["fetchAllRepositories"]],
    toast: {
      errorTitle: () => "Could not add repository",
      successTitle: () => "Repository added",
    },
  })

  const handleRepoAdd = async () => {
    if (!repoLink.trim()) return

    await addRepoMutation.mutateAsync({
      link_to_manifest: repoLink.trim(),
    })

    setRepoLink("")
  }

  const isFormValid = repoLink.trim().length > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      <Card
        variant="outlined"
        className="border-dashed border-2 hover:border-accent/60 transition-colors"
      >
        <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center gap-3 pb-3 border-b border-accent/20">
            <Plus
              className="border border-accent/80 p-1.5 border-dotted rounded-md text-accent"
              size={36}
            />
            <h3 className="text-lg font-semibold">Add Repository</h3>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <Input
              size="md"
              variant="filled"
              value={repoLink}
              onChange={setRepoLink}
              type="url"
              placeholder="Raw manifest or repository link"
            />

            <p className="text-xs text-muted-foreground">
              Paste a direct link to the repository or raw manifest. Dockstat will automatically
              resolve the configuration.
            </p>
          </div>

          <Button
            onClick={handleRepoAdd}
            disabled={!isFormValid || addRepoMutation.isPending}
            className="w-full mt-auto"
          >
            {addRepoMutation.isPending ? "Adding..." : "Add Repository"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
