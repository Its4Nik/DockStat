import { useContext } from "react"
import { ConfigProviderContext, type ConfigProviderData } from "@/contexts/config"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const eden = useContext(EdenClientContext)

  const { data } = eden.query({
    queryKey: ["fetchAdditionalSettings"],
    route: api.db.config.get,
  })

  const pDat: ConfigProviderData = {
    additionalSettings: data?.additionalSettings,
    hotkeys: data?.hotkeys,
    navLinks: data?.nav_links,
  }

  return <ConfigProviderContext value={pDat || {}}>{children}</ConfigProviderContext>
}
