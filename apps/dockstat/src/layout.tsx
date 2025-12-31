import { Navbar } from "@dockstat/ui"
import { useGlobalBusy } from "./hooks/isLoading"
import { useQuery } from "@tanstack/react-query"
import { fetchNavLinks } from "./lib/queries/fetchNavLinks"

export default function Layout({ children }: { children: React.ReactNode }) {
  let { data } = useQuery({
    queryKey: ["fetchNavLinks"],
    queryFn: fetchNavLinks,
  })

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
      <Navbar isBusy={useGlobalBusy()} paths={data} />
      <div className="px-4">{children}</div>
    </div>
  )
}
