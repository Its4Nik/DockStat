import { Navbar } from "@dockstat/ui"
import { GlobalBusy } from "./utils/isLoading"
import { getCurrentLocation } from "./utils/locations"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-main-bg h-screen w-screen p-4">
      <Navbar isBusy={GlobalBusy()} location={getCurrentLocation().pathname} />
      {children}
    </div>
  )
}
