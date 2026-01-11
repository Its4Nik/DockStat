import { ConfigProviderContext, type ConfigProviderData } from "@/contexts/config"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { api } from "@/lib/api"

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const { data } = useEdenQuery({
    queryKey: ["fetchAdditionalSettings"],
    route: api.api.v2.db.config.get,
  })

  const pDat: ConfigProviderData = {
    additionalSettings: data?.addtionalSettings,
    navLinks: data?.nav_links,
  }

  return <ConfigProviderContext value={pDat || {}}>{children}</ConfigProviderContext>
}
