import { eden } from "@dockstat/utils/react"
import { ConfigProviderContext, type ConfigProviderData } from "@/contexts/config"
import { api } from "@/lib/api"

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const { data } = eden.useEdenQuery({
    queryKey: ["fetchAdditionalSettings"],
    route: api.db.config.get,
  })

  const pDat: ConfigProviderData = {
    additionalSettings: data?.additionalSettings,
    navLinks: data?.nav_links,
    hotkeys: data?.hotkeys,
  }

  return <ConfigProviderContext value={pDat || {}}>{children}</ConfigProviderContext>
}
