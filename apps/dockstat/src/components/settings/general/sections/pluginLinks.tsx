import { Badge, Card, Divider } from "@dockstat/ui"
import { Puzzle } from "lucide-react"
import type { NavLink, PluginLink } from "./useGeneralSettings"

export function PluginLinksSection({
  pluginLinks,
  allNavLinks,
}: {
  pluginLinks: PluginLink[]
  allNavLinks: NavLink[]
}) {
  return (
    <>
      <Divider variant="dotted" />
      <div>
        <Card
          className="flex items-center gap-2 mb-4"
          size="sm"
          variant="flat"
        >
          <Puzzle
            className="text-accent"
            size={24}
          />
          <h2 className="text-2xl font-semibold text-muted-text">Plugin Routes</h2>
        </Card>

        <Card
          className="grid gap-3 p-4"
          variant="dark"
        >
          {pluginLinks.map((plugin) => (
            <div
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/5"
              key={plugin.route}
            >
              <div className="p-2 rounded-lg bg-accent/10">
                <Puzzle
                  className="text-accent"
                  size={18}
                />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{plugin.name}</div>
                <div className="text-sm text-muted-text">{plugin.route}</div>
              </div>
              {allNavLinks.some((link) => link.path === plugin.route) && (
                <Badge
                  size="sm"
                  variant="success"
                >
                  Pinned
                </Badge>
              )}
            </div>
          ))}
        </Card>
      </div>
    </>
  )
}
