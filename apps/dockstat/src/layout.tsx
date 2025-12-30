import { Navbar } from "@dockstat/ui"
import { useGlobalBusy } from "./hooks/isLoading"
import { useCurrentLocation } from "./hooks/locations"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-main-bg h-screen w-screen p-4">
      <Navbar isBusy={useGlobalBusy()} location={useCurrentLocation().pathname} />
      {children}
    </div>
  )
}
