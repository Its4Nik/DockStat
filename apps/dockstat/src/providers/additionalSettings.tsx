import { useEdenClient } from "@dockstat/utils/react"
import { useMemo } from "react"
import { ConfigProviderContext, type ConfigProviderData } from "@/contexts/config"
import { api } from "@/lib/api"

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const eden = useEdenClient()

  const { data } = eden.query({
    queryKey: ["fetchAdditionalSettings"],
    route: api.db.config.get,
  })

  const pDat = useMemo<ConfigProviderData>(
    () => ({
      additionalSettings: data?.additionalSettings,
      hotkeys: data?.hotkeys,
      navLinks: data?.nav_links,
    }),
    [data?.additionalSettings, data?.hotkeys, data?.nav_links]
  )

  return <ConfigProviderContext value={pDat}>{children}</ConfigProviderContext>
}
