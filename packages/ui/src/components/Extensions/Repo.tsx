import type { PluginMetaType, RepoType } from "@dockstat/typings/types"
import {
  Blocks,
  BookTemplate,
  Check,
  Link,
  Lock,
  LockOpen,
  PaintBucket,
  Puzzle,
  Table,
  X,
} from "lucide-react"
import { useState } from "react"
import { getRepoIcon } from "../../utils/repoIcons"
import { Badge } from "../Badge/Badge"
import { Button } from "../Button/Button"
import { Card, CardBody, CardHeader } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { Checkbox } from "../Forms/Checkbox"
import { HoverBubble } from "../HoverBubble/HoverBubble"
import { LinkWithIcon } from "../Link/Link"
import { RepoPluginSlide } from "./slides/Plugin"

function Plugins({
  pluginsAsTable = false,
  plugins,
  installedPlugins,
}: {
  pluginsAsTable: boolean
  plugins: PluginMetaType[]
  installedPlugins: Record<string, { version: string; id: number }>
}) {
  if (pluginsAsTable) {
    return
  }

  return <RepoPluginSlide plugins={plugins} installedPlugins={installedPlugins} />
}

export function Repo({
  repo,
  plugins,
  installedPlugins,
}: {
  repo: RepoType
  plugins: PluginMetaType[]
  installedPlugins: Record<string, { version: string; id: number }>
}) {
  const [selectedType, setSelectedType] = useState<"plugins" | "themes" | "stacks">("plugins")

  const [asTable, setAsTable] = useState<boolean>(false)

  return (
    <Card hoverable variant="outlined" className="w-full" size="md">
      <CardHeader className="">
        <div className="justify-between flex">
          <p>
            <LinkWithIcon
              iconPosition="left"
              external
              key={repo.source}
              icon={<Link />}
              href={`/api/extensions/proxy/repo/${repo.type}/${repo.source}`}
            >
              {repo.name}
            </LinkWithIcon>
          </p>

          <div className="flex flex-row space-x-2 my-auto">
            <Badge variant={repo.policy === "relaxed" ? "error" : "success"}>
              {repo.policy === "relaxed" ? (
                <HoverBubble
                  label="Relaxed Repository Setting! This is not adviced"
                  position="bottom"
                >
                  <LockOpen />
                </HoverBubble>
              ) : (
                <HoverBubble
                  label={`This Repository will veryfiy all downloadable content.

                The Endpoint is this:
                ${repo.verification_api}`}
                  position="bottom"
                >
                  <Lock />
                </HoverBubble>
              )}
            </Badge>

            {repo.policy === "strict" ? (
              <Badge variant={repo.isVerified ? "success" : "error"}>
                {repo.isVerified ? (
                  <HoverBubble
                    position="bottom"
                    label="Repository is verified.

             This Repository is verified and trusted by the Auth-API"
                  >
                    <Check />
                  </HoverBubble>
                ) : (
                  <HoverBubble
                    position="bottom"
                    label="This Repository is not verified!

                    You can still download from here, but there will be a warning everytime!"
                  >
                    <X />
                  </HoverBubble>
                )}
              </Badge>
            ) : null}
            <Divider shadow={false} orientation="vertical" className="ml-4 py-4" variant="solid" />
            <Badge className="mx-4">{getRepoIcon(repo.type)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="w-fit flex-row space-x-2">
          <Button
            size="sm"
            disabled={selectedType === "plugins"}
            variant={selectedType === "plugins" ? "outline" : "primary"}
            onClick={() => setSelectedType("plugins")}
          >
            <Puzzle className="w-4 h-4 mr-1" />
            Plugins ({plugins.length})
          </Button>
          <Button
            size="sm"
            disabled={selectedType === "stacks"}
            variant={selectedType === "stacks" ? "outline" : "primary"}
            onClick={() => setSelectedType("stacks")}
          >
            <BookTemplate className="w-4 h-4 mr-1" />
            Stacks
          </Button>
          <Button
            size="sm"
            disabled={selectedType === "themes"}
            variant={selectedType === "themes" ? "outline" : "primary"}
            onClick={() => setSelectedType("themes")}
          >
            <PaintBucket className="w-4 h-4 mr-1" />
            Themes
          </Button>
          <Checkbox
            variant="icon"
            tickedIcon={<Table />}
            unTickedIcon={<Blocks />}
            onChange={() => setAsTable(!asTable)}
          />
          <Divider className="my-4" variant="dotted" />
        </div>

        {selectedType === "plugins" ? (
          <Plugins plugins={plugins} installedPlugins={installedPlugins} pluginsAsTable={asTable} />
        ) : null}
      </CardBody>
    </Card>
  )
}
