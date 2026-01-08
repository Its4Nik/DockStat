import { deletePlugin, installPlugin } from "@Actions"
import { fetchAllManifests, fetchAllPlugins, fetchAllRepositories } from "@Queries"
import { Badge, Button, Card, Divider, Input, LinkWithIcon, Modal } from "@dockstat/ui"
import { repo } from "@dockstat/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "lucide-react"
import { useContext, useEffect, useMemo, useState } from "react"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"
import { toast } from "@/lib/toast"

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

export default function PluginBrowser() {
  const { setHeading } = useContext(PageHeadingContext)

  useEffect(() => {
    setHeading("Plugin Browser")
  }, [setHeading])

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
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["fetchAllPlugins"] }),
        qc.invalidateQueries({ queryKey: ["fetchFrontendPluginRoutes"] }),
      ])
    },
  })

  const deletePluginMutation = useMutation({
    mutationFn: deletePlugin,
    mutationKey: ["deletePlugin"],
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["fetchAllPlugins"] }),
        qc.invalidateQueries({ queryKey: ["fetchFrontendPluginRoutes"] }),
      ])
    },
  })

  const handleDelete = async (id: number) => {
    const res = await deletePluginMutation.mutateAsync(id)

    toast({
      description: res.message,
      title: res.success
        ? `Uninstalled PluginID: ${id}`
        : `Error while uninstalling PluginID: ${id}`,
      variant: res.success ? "success" : "error",
    })
  }

  const handleInstall = async (plugin: AvailablePlugin) => {
    const res = await installPluginMutation.mutateAsync({
      id: plugin.isInstalled && plugin.installedId ? plugin.installedId : null,
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

    toast({
      title: res.success ? `Installed ${plugin.name}` : `Failed to install ${plugin.name}`,
      description: res.message,
      variant: res.success ? "success" : "error",
    })

    return
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
          <Card variant="flat" key={`${plugin.repository}-${plugin.manifest}-${idx}`}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{plugin.name}</h3>
                  <p className="text-sm text-muted-text">{plugin.version}</p>
                </div>
                {plugin.isInstalled && <Badge variant="success">Installed</Badge>}
              </div>

              <p className="text-sm text-secondary-text">{plugin.description}</p>

              {plugin.tags && plugin.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {plugin.tags.map((tag) => (
                    <Badge key={tag} unique>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Divider />

              <div className="text-xs text-muted-text space-y-1">
                <p>
                  Author: <span className="text-accent">{plugin.author.name}</span>
                </p>
                <p>
                  License: <span className="text-accent">{plugin.author.license}</span>
                </p>
                <p>
                  Repository:{" "}
                  <LinkWithIcon
                    external
                    iconPosition="right"
                    icon={<Link size={12} />}
                    href={parseRepoLink(plugin.repoType, plugin.repoSource)}
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
                {plugin.isInstalled && plugin.installedId && (
                  <Button
                    className="flex-1"
                    variant="danger"
                    // biome-ignore lint/style/noNonNullAssertion: checked if an ID exists
                    onClick={() => handleDelete(plugin.installedId!)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {availablePlugins.length === 0 && (
        <div className="text-center py-12 text-muted-text">No plugins found</div>
      )}

      <Modal
        open={!!selectedPlugin}
        onClose={() => setSelectedPlugin(null)}
        title={selectedPlugin?.name}
        bodyClasses=""
      >
        {selectedPlugin && (
          <div className="space-y-4 w-60">
            <Card size="sm" variant="outlined">
              <h4 className="font-semibold mb-1">Description</h4>
              <p className="text-secondary-text">{selectedPlugin.description}</p>
            </Card>

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
