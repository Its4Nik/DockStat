import { Navbar } from "@dockstat/ui"
import { useQuery } from "@tanstack/react-query"
import { useContext, useEffect, useState } from "react"
import { AdditionalSettingsContext } from "@/contexts/additionalSettings"
import { useGlobalBusy } from "./hooks/isLoading"
import { fetchNavLinks } from "./lib/queries/fetchNavLinks"
import { rssFeedEffect } from "./lib/websocketEffects/rssFeed"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [ramUsage, setRamUsage] = useState<string>("Connecting...")
  const showRamUsage = useContext(AdditionalSettingsContext).showBackendRamUsageInNavbar

  let { data } = useQuery({
    queryKey: ["fetchNavLinks"],
    queryFn: fetchNavLinks,
  })

  useEffect(() => {
    const cleanup = rssFeedEffect(setRamUsage)
    return cleanup
  }, [])

  if (data?.length === 0) {
    data = [
      {
        slug: "Home",
        path: "/",
      },
      {
        slug: "Clients",
        path: "/clients",
      },
      {
        slug: "Plugins",
        path: "/plugins",
      },
    ]
  }

  return (
    <div className="bg-main-bg min-h-screen w-screen p-4">
      <Navbar
        isBusy={useGlobalBusy()}
        paths={data}
        ramUsage={showRamUsage ? ramUsage : undefined}
      />
      <div className="px-4">{children}</div>
    </div>
  )
}
