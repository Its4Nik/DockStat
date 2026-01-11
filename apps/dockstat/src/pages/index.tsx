import { Badge, type BadgeVariant, Card, Divider } from "@dockstat/ui"
import { usePageHeading } from "@/hooks/useHeading"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { api } from "@/lib/api"

export default function IndexPage() {
  usePageHeading("Home")

  const { data, isLoading, error } = useEdenQuery({
    queryKey: ["fetchBackendStatus"],
    route: api.api.v2.status.get,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Something went wrong</div>

  const services = data?.services || []
  const servicesCount = services.length || 0
  const initializedServicesCount = services.map((s) => s.initialized === true).length || 0

  let serviceBadgeVariant: BadgeVariant = "success"

  if (servicesCount > initializedServicesCount) serviceBadgeVariant = "warning"
  if (initializedServicesCount === 0) serviceBadgeVariant = "error"

  return (
    <div>
      <div className="flex justify-between">
        <Badge variant={data?.status === "healthy" ? "success" : "error"}>
          Backend State: {data?.status?.toUpperCase()}
        </Badge>
        <Badge variant={serviceBadgeVariant}>
          {initializedServicesCount}/{servicesCount} Services initialized
        </Badge>
      </div>
      <Divider className="my-2" label="Services" />
      <div className="flex flex-row flex-wrap gap-4">
        {services.map((s) => {
          const serviceName = s.name
          return (
            <Card variant="elevated" key={serviceName} size="sm">
              {serviceName}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
