import { installPlugin } from "@Actions"
import { fetchAllManifests, fetchAllPlugins, fetchAllRepositories } from "@Queries"
import { DBPluginShemaT } from "@dockstat/typings/types"
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Input,
  LinkWithIcon,
  Modal,
  Slides,
} from "@dockstat/ui"
import { repo } from "@dockstat/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useContext, useMemo, useState } from "react"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"

const parseRepoLink = repo.parseFromDBToRepoLink

// Add this type for available plugins from manifests
type AvailablePlugin = {
  name: string
  description: string
  version: string
  repository: string
  repoType: "local" | "http" | "github" | "gitlab" | "gitea" | "default"
  manifest: string
  author: {
    name: string
    website?: string
    license: string
    email?: string
  }
  tags?: string[]
  repoSource: string
  isInstalled: boolean
  installedId?: number | null // track the installed plugin's id for updates
}

export default function () {
  useContext(PageHeadingContext).setHeading("Extensions")

  const qc = useQueryClient()
  const [selectedRepo, setSelectedRepo] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlugin, setSelectedPlugin] = useState<AvailablePlugin | null>(null)

  const { data: allPlugins } = useQuery({
    queryFn: fetchAllPlugins,
    queryKey: ["fetchAllPlugins"],
  })

  const { data: allRepos } = useQuery({
    queryFn: fetchAllRepositories,
    queryKey: ["fetchAllRepositories"],
  })

  const { data: allManifests } = useQuery({
    queryFn: fetchAllManifests,
    queryKey: ["fetchAllManifests"],
  })

  const installPluginMutation = useMutation({
    mutationFn: installPlugin,
    mutationKey: ["installPlugin"],
    onSuccess: async () => await qc.invalidateQueries({ queryKey: ["fetchAllPlugins"] }),
  })

  const handleInstall = async (plugin: AvailablePlugin) => {
    await installPluginMutation.mutateAsync({
      id: plugin.isInstalled ? null : null,
      plugin: "", // handled by backend
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      repository: plugin.repository,
      repoType: plugin.repoType,
      manifest: plugin.manifest,
      author: plugin.author,
      tags: plugin.tags,
    })
  }

  const availablePlugins = useMemo(() => {
    if (!allManifests) return []

    const plugins = Object.entries(allManifests).flatMap(([_, manifest]) =>
      manifest.data.plugins.map((plugin) => {
        const installedPlugin = allPlugins?.find(
          (p) => p.repository === plugin.repository && p.manifest === plugin.manifest
        )
        return {
          ...plugin,
          repoSource: manifest.repoSource,
          isInstalled: !!installedPlugin,
          installedId: installedPlugin?.id ?? null,
        }
      })
    )

    return plugins.filter(
      (p) =>
        (selectedRepo === "all" || p.repository === selectedRepo) &&
        (searchQuery === "" ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
    )
  }, [allManifests, allPlugins, selectedRepo, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e)}
          className="flex-1 px-4 py-2 border rounded"
        />
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">All Repositories</option>
          {allRepos?.map((repo) => (
            <option key={repo.id} value={repo.source}>
              {repo.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availablePlugins.map((plugin, idx) => (
          <Card key={`${plugin.repository}-${plugin.manifest}-${idx}`}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{plugin.name}</h3>
                  <p className="text-sm text-gray-600">{plugin.version}</p>
                </div>
                {plugin.isInstalled && <Badge variant="success">Installed</Badge>}
              </div>

              <p className="text-sm text-gray-700">{plugin.description}</p>

              {plugin.tags && plugin.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {plugin.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Divider />

              <div className="text-xs text-gray-500 space-y-1">
                <p>Author: {plugin.author.name}</p>
                <p>License: {plugin.author.license}</p>
                <p>
                  Repository:{" "}
                  <LinkWithIcon
                    external
                    href={parseRepoLink(plugin.repoType, plugin.repoSource)}
                    className="text-blue-600 hover:underline"
                  >
                    {plugin.repository}
                  </LinkWithIcon>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedPlugin(plugin)}
                  variant="secondary"
                  className="flex-1"
                >
                  Details
                </Button>
                <Button
                  onClick={() => handleInstall(plugin)}
                  disabled={plugin.isInstalled || installPluginMutation.isPending}
                  className="flex-1"
                >
                  {plugin.isInstalled ? "Installed" : "Install"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {availablePlugins.length === 0 && (
        <div className="text-center py-12 text-gray-500">No plugins found</div>
      )}

      <Modal
        open={!!selectedPlugin}
        onClose={() => setSelectedPlugin(null)}
        title={selectedPlugin?.name}
      >
        {selectedPlugin && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Description</h4>
              <p className="text-gray-700">{selectedPlugin.description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Version</h4>
              <p className="text-gray-700">{selectedPlugin.version}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Author</h4>
              <p className="text-gray-700">{selectedPlugin.author.name}</p>
              {selectedPlugin.author.email && (
                <p className="text-sm text-gray-600">{selectedPlugin.author.email}</p>
              )}
              {selectedPlugin.author.website && (
                <a
                  href={selectedPlugin.author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Website
                </a>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-1">License</h4>
              <p className="text-gray-700">{selectedPlugin.author.license}</p>
            </div>

            {selectedPlugin.tags && selectedPlugin.tags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedPlugin.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => handleInstall(selectedPlugin)}
              disabled={selectedPlugin.isInstalled || installPluginMutation.isPending}
              className="w-full"
            >
              {selectedPlugin.isInstalled ? "Already Installed" : "Install"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
