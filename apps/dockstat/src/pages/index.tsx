import { Badge, Card, CardHeader } from "@dockstat/ui"
import { FetchBackendStatus } from "@Queries/fetchStatus"
import { useQuery } from "@tanstack/react-query"

export default function IndexPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["FetchBackendStatus-indexpage"],
    queryFn: FetchBackendStatus,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Something went wrong</div>

  const servicesCount = data?.services.length || 0
  const initializedServicesCount = data?.services.map((s) => s.initialized === true).length || 0

  const serviceBadgeVariant =
    servicesCount === initializedServicesCount
      ? "success"
      : servicesCount > initializedServicesCount
        ? "warning"
        : "error"

  return (
    <div className="flex justify-between">
      <Badge variant={data?.status === "healthy" ? "success" : "error"}>
        Backend State: {data?.status?.toUpperCase()}
      </Badge>
      <Badge variant={serviceBadgeVariant}>
        {initializedServicesCount}/{servicesCount} Services initialized
      </Badge>
    </div>
  )
}
