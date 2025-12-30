import { FishingHook, Microchip, Puzzle, ServerCog, StickyNote } from "lucide-react"
import { StatCard } from "../adapters"
import { Divider } from "@dockstat/ui"

export function StatusBar({
  installedPluginsCount,
  frontendRoutesCount,
  serverRoutesCount,
  hooksCount,
  loadedPluginsCount,
}: {
  installedPluginsCount: number
  frontendRoutesCount: number
  serverRoutesCount: number
  hooksCount: number
  loadedPluginsCount: number
}) {
  return (
    <div className="-mt-4 flex w-full justify-between flex-wrap gap-4">
      <StatCard
        label="Installed Plugins"
        value={installedPluginsCount}
        icon={<Puzzle size={20} />}
        variant="default"
      />

      <Divider className="w-10! my-auto" variant="dotted" />

      <StatCard
        label="Frontend Pages"
        value={frontendRoutesCount}
        variant="default"
        icon={<StickyNote size={20} />}
      />

      <Divider className="w-10! my-auto" variant="dotted" />

      <StatCard
        label="API Routes"
        value={serverRoutesCount}
        variant="default"
        icon={<ServerCog size={20} />}
      />

      <Divider className="w-10! my-auto" variant="dotted" />

      <StatCard
        label="Available Hooks"
        value={hooksCount}
        variant="default"
        icon={<FishingHook size={20} />}
      />

      <Divider className="w-10! my-auto" variant="dotted" />

      <StatCard
        label="Loaded Plugins"
        value={loadedPluginsCount}
        variant="default"
        icon={<Microchip size={20} />}
      />
    </div>
  )
}
