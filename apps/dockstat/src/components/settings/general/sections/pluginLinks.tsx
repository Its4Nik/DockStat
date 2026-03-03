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
        <Card size="sm" variant="flat" className="flex items-center gap-2 mb-4">
          <Puzzle size={24} className="text-accent" />
          <h2 className="text-2xl font-semibold text-muted-text">Plugin Routes</h2>
        </Card>

        <Card variant="dark" className="grid gap-3 p-4">
          {pluginLinks.map((plugin) => (
            <div key={plugin.route} className="flex items-center gap-3 p-3 rounded-lg bg-muted/5">
              <div className="p-2 rounded-lg bg-accent/10">
                <Puzzle size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{plugin.name}</div>
                <div className="text-sm text-muted-text">{plugin.route}</div>
              </div>
              {allNavLinks.some((link) => link.path === plugin.route) && (
                <Badge variant="success" size="sm">
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
