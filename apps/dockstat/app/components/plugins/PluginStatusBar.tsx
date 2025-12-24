import { Divider } from "@dockstat/ui"
import { CheckCircle, Package, Play, ShieldAlert, ShieldCheck, Store } from "lucide-react"
import { StatCard } from "../adapters/StatCard"
import type { PluginStatusBarProps } from "./types"

export function PluginStatusBar({
  totalPlugins,
  loadedPlugins,
  verifiedPlugins,
  safePlugins,
  unsafePlugins,
  totalRepositories,
}: PluginStatusBarProps) {
  const loadedVariant = loadedPlugins > 0 ? "success" : "warning"
  const safeVariant = safePlugins > 0 ? "success" : "default"
  const unsafeVariant = unsafePlugins > 0 ? "error" : "default"

  return (
    <div className="-mt-4 flex w-full justify-between flex-wrap gap-4">
      <StatCard
        label="Total Plugins"
        value={totalPlugins}
        icon={<Package size={20} />}
        variant="default"
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Loaded"
        value={`${loadedPlugins}/${totalPlugins}`}
        icon={<Play size={20} />}
        variant={loadedVariant}
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Verified"
        value={verifiedPlugins}
        icon={<CheckCircle size={20} />}
        variant="default"
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Safe"
        value={safePlugins}
        icon={<ShieldCheck size={20} />}
        variant={safeVariant}
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Unsafe"
        value={unsafePlugins}
        icon={<ShieldAlert size={20} />}
        variant={unsafeVariant}
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Repositories"
        value={totalRepositories}
        icon={<Store size={20} />}
        variant="default"
      />
    </div>
  )
}
