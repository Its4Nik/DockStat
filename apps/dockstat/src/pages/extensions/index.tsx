import { Button, Card, Input } from "@dockstat/ui"
import { eden } from "@dockstat/utils/react"
import { Plus } from "lucide-react"
import { useState } from "react"
import { RepoCard } from "@/components/extensions/RepoCard"
import { useAddRepoMutation } from "@/hooks/mutations"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

export default function ExtensionsIndex() {
  usePageHeading("Repositories")

  const [repoLink, setRepoLink] = useState("")

  const { data } = eden.useEdenQuery({
    queryKey: ["fetchAllRepositories"],
    route: api.repositories.all.get,
  })

  const addRepoMutation = useAddRepoMutation()

  const handleRepoAdd = async (link?: string) => {
    const pLink = (link ?? repoLink).trim()
    if (!pLink) return

    await addRepoMutation.mutateAsync({
      link_to_manifest: pLink,
    })

    setRepoLink("")
  }

  const isFormValid = repoLink.trim().length > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.length === 0 ? (
        <Card
          className="border-dashed border-2 hover:border-accent/60 transition-colors"
          variant="outlined"
        >
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center gap-3 pb-3 border-b border-accent/20">
              <Plus
                className="border border-accent/80 p-1.5 border-dotted rounded-md text-accent"
                size={36}
              />
              <h3 className="text-lg font-semibold">Add DockStat's default Repository</h3>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              <p className="text-xs text-muted-foreground">
                The default repository features plugins, themes and stacks that have been verified
                through the DockStore-Verification-API.
              </p>
            </div>

            <Button
              className="w-full mt-auto"
              disabled={addRepoMutation.isPending}
              onClick={() =>
                handleRepoAdd(
                  "https://raw.githubusercontent.com/Its4Nik/DockStat/refs/heads/feat-settings-page/apps/dockstore/repo.json"
                )
              }
            >
              {addRepoMutation.isPending ? "Adding..." : "Add Repository"}
            </Button>
          </div>
        </Card>
      ) : null}

      {data?.map((repo) => (
        <RepoCard
          id={repo.id}
          key={repo.id}
          name={repo.name}
          policy={repo.policy}
          source={repo.source}
          type={repo.type}
          verification_api={repo.verification_api}
        />
      ))}

      <Card
        className="border-dashed border-2 hover:border-accent/60 transition-colors"
        variant="outlined"
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
              onChange={setRepoLink}
              placeholder="https://raw.githubusercontent.com/Its4Nik/DockStat/refs/heads/feat-settings-page/apps/dockstore/repo.json"
              size="md"
              type="url"
              value={repoLink}
              variant="filled"
            />

            <p className="text-xs text-muted-foreground">
              Paste a direct link to the repository or raw manifest. Dockstat will automatically
              resolve the configuration.
            </p>
          </div>

          <Button
            className="w-full mt-auto"
            disabled={!isFormValid || addRepoMutation.isPending}
            onClick={() => handleRepoAdd()}
          >
            {addRepoMutation.isPending ? "Adding..." : "Add Repository"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
