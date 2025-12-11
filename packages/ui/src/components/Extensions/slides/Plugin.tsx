import type { DBPluginShemaT, PluginMetaType } from "@dockstat/typings/types"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import { Card, CardBody, CardFooter, CardHeader } from "../../Card/Card"
import { Badge } from "../../Badge/Badge"
import { Modal } from "../../Modal/Modal"
import { useEffect, useState } from "react"
import { Download, Info, RefreshCcwDot, Trash } from "lucide-react"
import { Button } from "../../Button/Button"
import { LinkWithIcon } from "../../Link/Link"

type RepoPluginSlideProps = {
  plugins: PluginMetaType[]
  installedPlugins: Record<string, { version: string; id: number }>
}

/**
 * Extract number sequences from a version string and return them as numbers.
 * E.g. "v1.2.3-alpha" -> [1,2,3], "2023.10" -> [2023,10]
 */
function extractNumbersFromVersion(version?: string): number[] {
  if (!version) return []
  const matches = version.match(/\d+/g) || []
  return matches.map((s) => parseInt(s, 10))
}

/**
 * Compare two version strings by their numeric components.
 * Returns:
 *   1  if a > b
 *   -1 if a < b
 *   0  if equal
 */
function compareVersionStrings(a?: string, b?: string): number {
  const an = extractNumbersFromVersion(a)
  const bn = extractNumbersFromVersion(b)
  const len = Math.max(an.length, bn.length)
  for (let i = 0; i < len; i++) {
    const av = an[i] ?? 0
    const bv = bn[i] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

export function RepoPluginSlide({ plugins, installedPlugins }: RepoPluginSlideProps) {
  const [showModal, setShowModal] = useState<string>("")

  return (
    <Card variant="flat" size="sm">
      <CardHeader className="text-md font-semibold">Plugins</CardHeader>
      <CardBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plugins.map((plugin) => {
            const installed = installedPlugins[plugin.name]
            const isInstalled = installed ? installed.version === plugin.version : false

            const canBeUpdated = installed
              ? compareVersionStrings(plugin.version, installed.version) > 0
              : false

            return (
              <PluginCard
                isInstalled={isInstalled}
                canBeUpdated={canBeUpdated}
                key={`${plugin.name}-${plugin.repository}`}
                plugin={plugin}
                showModal={showModal}
                setShowModal={setShowModal}
                pluginId={isInstalled ? installed.id : null}
              />
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

function PluginCard({
  plugin,
  showModal,
  setShowModal,
  isInstalled,
  canBeUpdated,
  pluginId = null,
}: {
  plugin: PluginMetaType
  showModal: string
  setShowModal: (id: string) => void
  isInstalled: boolean
  canBeUpdated: boolean
  pluginId: number | null
}) {
  const [pluginObject, setPluginObject] = useState<Omit<DBPluginShemaT, "id"> | null>(null)

  const fetcher = useFetcher<{
    success: boolean
    message?: string
    error?: string
  }>()

  useEffect(() => {
    if (!fetcher.data) return
    if (fetcher.state !== "idle") return

    const isError = !!fetcher.data.error

    const isDelete = isInstalled && !canBeUpdated
    const isUpdate = canBeUpdated

    const title = isDelete
      ? `Installed ${plugin.name}@${plugin.version}`
      : isUpdate
        ? `Updated ${plugin.name}@${plugin.version}`
        : `Deleted ${plugin.name}@${plugin.version}`

    const icon = isDelete ? (
      <Download className={isError ? "text-error" : "text-success"} />
    ) : isUpdate ? (
      <RefreshCcwDot className={isError ? "text-error" : "text-success"} />
    ) : (
      <Trash className={isError ? "text-error" : "text-success"} />
    )

    if (isError) {
      toast.error(title, {
        description: fetcher.data.message,
        icon,
        duration: 5000,
        dismissible: true,
      })
    } else {
      toast.success(title, {
        description: fetcher.data.message,
        icon,
        duration: 5000,
        dismissible: true,
      })
    }
  }, [fetcher.state, fetcher.data, isInstalled, canBeUpdated, plugin])

  useEffect(() => {
    const getPluginBundle = async () => {
      return await (
        await fetch(
          `http://localhost:5173/api/extensions/proxy/plugin/bundle/${plugin.repoType.trim()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: `${plugin.repository}/${plugin.manifest.replace(
                "/manifest.yml",
                "/bundle/index.js"
              )}`,
            }),
          }
        )
      ).text()
    }

    getPluginBundle().then((d) => {
      const pluginObject: DBPluginShemaT = {
        id: pluginId,
        ...plugin,
        plugin: String(d),
      }
      setPluginObject(pluginObject)
    })
  }, [plugin, pluginId])

  const fetching = fetcher.state !== "idle"
  const id = `${plugin.name}-${plugin.repository}`

  const hasCorrectPluginData = pluginObject && pluginObject.plugin !== "Not Found"

  return (
    <Card size="sm" variant="elevated" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <LinkWithIcon
              href={`/api/extensions/proxy/plugins/${plugin.repoType}/${plugin.repository}/${plugin.manifest}`}
              external
            >
              {plugin.name}
            </LinkWithIcon>
            <Button
              className="p-0 w-4 h-4 ml-2"
              size="sm"
              variant="ghost"
              onClick={() => setShowModal(id)}
            >
              <Info className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-text font-bold">{plugin.version}</span>
            {canBeUpdated && (
              <Badge variant="warning" size="sm">
                Update available
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {(plugin.tags || []).map((tag) => (
            <Badge key={tag} unique size="sm">
              {tag}
            </Badge>
          ))}
          {!hasCorrectPluginData && (
            <Badge variant="error" size="sm">
              No Data for this Plugin received
            </Badge>
          )}
        </div>
      </CardHeader>

      <Modal open={showModal === id} onClose={() => setShowModal("")}>
        <ul className="mt-2 space-y-1">
          {plugin.repository && (
            <li>
              <strong>Repo:</strong> {plugin.repository}
            </li>
          )}
          {plugin.manifest && (
            <li>
              <strong>Manifest:</strong> {plugin.manifest}
            </li>
          )}
          {plugin.author.name && (
            <li>
              <strong>Author:</strong> {plugin.author.name}
            </li>
          )}
          {plugin.author.email && (
            <li>
              <strong>Email:</strong> {plugin.author.email}
            </li>
          )}
          {plugin.author.website && (
            <li>
              <strong>Website:</strong>{" "}
              <a
                href={plugin.author.website}
                className="text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {plugin.author.website}
              </a>
            </li>
          )}
          {plugin.author.license && (
            <li>
              <strong>License:</strong> {plugin.author.license}
            </li>
          )}
        </ul>
      </Modal>

      <CardBody className="max-w-80 space-y-1 text-sm text-muted-text">
        <Card size="sm" variant="outlined" hoverable={false}>
          {plugin.description && <p className="text-foreground">{plugin.description}</p>}
        </Card>

        {/* Use fetcher.Form here so that navigation doesn’t change */}
        <fetcher.Form
          method="post"
          action={
            isInstalled
              ? canBeUpdated
                ? "/api/plugins/install"
                : "/api/plugins/delete"
              : "/api/plugins/install"
          }
        >
          <input type="hidden" name="pluginObject" value={JSON.stringify(pluginObject)} />
          <input type="hidden" name="pluginId" value={pluginId || undefined} />
          {/* If installed and update available show Update button.
                If not installed show Install button.
                If already installed and not update available show nothing. */}
          {isInstalled ? (
            canBeUpdated ? (
              <Button
                fullWidth
                type="submit"
                disabled={fetching ? true : !hasCorrectPluginData}
                variant={fetching ? "outline" : "primary"}
              >
                {fetching ? "Updating..." : "Update"}
              </Button>
            ) : (
              <Button
                fullWidth
                type="submit"
                disabled={fetching}
                variant={fetching ? "outline" : "danger"}
              >
                {fetching ? "Deleting..." : "Delete"}
              </Button>
            )
          ) : (
            <Button
              fullWidth
              type="submit"
              disabled={fetching ? true : !hasCorrectPluginData}
              variant={fetching ? "outline" : "primary"}
            >
              {fetching ? "Installing..." : "Install"}
            </Button>
          )}
        </fetcher.Form>
      </CardBody>
    </Card>
  )
}
