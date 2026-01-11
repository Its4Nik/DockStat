import { Badge, Button, Card, Divider, Input, LinkWithIcon, Modal } from "@dockstat/ui"
import { repo } from "@dockstat/utils"
import { Link } from "lucide-react"
import { useMemo, useState } from "react"
import { useEdenMutation } from "@/hooks/useEdenMutation"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

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
  usePageHeading("Plugin Browser")

  const [selectedRepo, setSelectedRepo] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlugin, setSelectedPlugin] = useState<AvailablePlugin | null>(null)

  const { data: allPlugins } = useEdenQuery({
    queryKey: ["fetchAllPlugins"],
    route: api.plugins.all.get,
  })

  const { data: allRepos } = useEdenQuery({
    queryKey: ["fetchAllRepositories"],
    route: api.repositories.all.get,
  })

  const { data: allManifests } = useEdenQuery({
    queryKey: ["fetchAllManifests"],
    route: api.repositories["all-manifests"].get,
  })

  const installPluginMutation = useEdenMutation({
    route: api.plugins.install.post,
    mutationKey: ["installPlugin"],
    invalidateQueries: [["fetchAllPlugins"], ["fetchFrontendPluginRoutes"]],
    toast: {
      errorTitle: (plugin) => `Failed to install ${plugin.name}`,
      successTitle: (plugin) => `Installed ${plugin.name}`,
    },
  })

  const deletePluginMutation = useEdenMutation({
    route: api.plugins.delete.post,
    mutationKey: ["deletePlugin"],
    invalidateQueries: [["fetchAllPlugins"], ["fetchFrontendPluginRoutes"]],
    toast: {
      errorTitle: (p) => `Error while uninstalling PluginID: ${p.pluginId}`,
      successTitle: (p) => `Uninstalled PluginID: ${p.pluginId}`,
    },
  })

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
                  onClick={() =>
                    installPluginMutation.mutateAsync({ ...plugin, id: plugin.installedId || null })
                  }
                  disabled={plugin.isInstalled || installPluginMutation.isPending}
                  className="flex-1"
                >
                  {plugin.isInstalled ? "Installed" : "Install"}
                </Button>
                {plugin.isInstalled && plugin.installedId && (
                  <Button
                    className="flex-1"
                    variant="danger"
                    onClick={() =>
                      // biome-ignore lint/style/noNonNullAssertion: checked if an ID exists
                      deletePluginMutation.mutateAsync({ pluginId: plugin.installedId! })
                    }
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
              onClick={() =>
                installPluginMutation.mutateAsync({
                  ...selectedPlugin,
                  id: selectedPlugin.installedId || null,
                })
              }
              disabled={selectedPlugin.isInstalled || installPluginMutation.isPending}
              fullWidth
            >
              {selectedPlugin.isInstalled ? "Already Installed" : "Install"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
