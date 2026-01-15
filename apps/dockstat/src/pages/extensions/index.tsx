import type { RepoType } from "@dockstat/typings/types"
import { Button, Card, Input, Select, Toggle } from "@dockstat/ui"
import { Plus } from "lucide-react"
import { useState } from "react"
import { RepoCard } from "@/components/extensions/RepoCard"
import { useEdenMutation } from "@/hooks/useEdenMutation"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

type RepoWithoutID = Omit<RepoType, "id">

export default function ExtensionsIndex() {
  usePageHeading("Repositories")

  const [formData, setFormData] = useState<RepoWithoutID>({
    name: "",
    policy: "relaxed",
    source: "",
    type: "github",
    verification_api: null,
  })

  const { data } = useEdenQuery({
    queryKey: ["fetchAllRepositories"],
    route: api.repositories.all.get,
  })

  const addRepoMutation = useEdenMutation({
    route: api.db.repositories.post,
    mutationKey: ["addRepo"],
    invalidateQueries: [["fetchAllRepositories"]],
    toast: {
      errorTitle: (repo) => `Could not add ${repo.name}`,
      successTitle: (repo) => `Added ${repo.name}`,
    },
  })

  const handleRepoAdd = async () => {
    if (formData.name && formData.source) {
      await addRepoMutation.mutateAsync({
        ...formData,
        verification_api:
          (formData?.verification_api || "").length > 5 ? formData.verification_api : null,
      })
      setFormData({
        name: "",
        policy: "relaxed",
        source: "",
        type: "github",
        verification_api: null,
      })
    }
  }

  const updateField = (field: keyof RepoWithoutID, value: RepoWithoutID[keyof RepoWithoutID]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.name.trim() && formData.source.trim()

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
              variant="underline"
              value={formData.name}
              onChange={(value) => updateField("name", value)}
              type="text"
              placeholder="Repository Name"
            />

            <Input
              size="sm"
              variant="filled"
              value={formData.source}
              onChange={(value) => updateField("source", value)}
              type="text"
              placeholder="Source (e.g., user/repo:branch/path)"
            />

            <Input
              size="sm"
              variant="filled"
              value={formData.verification_api || undefined}
              onChange={(value) => updateField("verification_api", value)}
              type="url"
              placeholder="Verification API (optional)"
            />

            <Select
              options={[
                { label: "GitHub", value: "github" },
                { label: "GitLab", value: "gitlab" },
                { label: "Local", value: "local" },
                { label: "HTTP/S", value: "http" },
              ]}
              value={formData.type}
              placeholder="Select repository type"
              variant="filled"
              onChange={(value) => updateField("type", value)}
            />

            <Toggle
              label={formData.policy === "strict" ? "Strict Policy" : "Relaxed Policy"}
              checked={formData.policy === "strict"}
              onChange={() => {
                updateField("policy", formData.policy === "relaxed" ? "strict" : "relaxed")
              }}
            />
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
