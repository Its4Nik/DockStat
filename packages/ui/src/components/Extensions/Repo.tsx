import type { PluginMetaType, RepoType } from "@dockstat/typings/types"
import {
  Blocks,
  BookTemplate,
  Link,
  Lock,
  LockOpen,
  PaintBucket,
  Puzzle,
  Table,
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

  return (
    <RepoPluginSlide
      installedPlugins={installedPlugins}
      plugins={plugins}
    />
  )
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
    <Card
      className="w-full"
      hoverable
      size="md"
      variant="outlined"
    >
      <CardHeader className="">
        <div className="justify-between flex">
          <p>
            <LinkWithIcon
              external
              href={`/api/extensions/proxy/repo/${repo.type}/${repo.source}`}
              icon={<Link />}
              iconPosition="left"
              key={repo.source}
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

            <Divider
              className="ml-4 py-4"
              orientation="vertical"
              shadow={false}
              variant="solid"
            />
            <Badge className="mx-4">{getRepoIcon(repo.type)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="w-fit flex-row space-x-2">
          <Button
            disabled={selectedType === "plugins"}
            onClick={() => setSelectedType("plugins")}
            size="sm"
            variant={selectedType === "plugins" ? "outline" : "primary"}
          >
            <Puzzle className="w-4 h-4 mr-1" />
            Plugins ({plugins.length})
          </Button>
          <Button
            disabled={selectedType === "stacks"}
            onClick={() => setSelectedType("stacks")}
            size="sm"
            variant={selectedType === "stacks" ? "outline" : "primary"}
          >
            <BookTemplate className="w-4 h-4 mr-1" />
            Stacks
          </Button>
          <Button
            disabled={selectedType === "themes"}
            onClick={() => setSelectedType("themes")}
            size="sm"
            variant={selectedType === "themes" ? "outline" : "primary"}
          >
            <PaintBucket className="w-4 h-4 mr-1" />
            Themes
          </Button>
          <Checkbox
            onChange={() => setAsTable(!asTable)}
            tickedIcon={<Table />}
            unTickedIcon={<Blocks />}
            variant="icon"
          />
          <Divider
            className="my-4"
            variant="dotted"
          />
        </div>

        {selectedType === "plugins" ? (
          <Plugins
            installedPlugins={installedPlugins}
            plugins={plugins}
            pluginsAsTable={asTable}
          />
        ) : null}
      </CardBody>
    </Card>
  )
}
