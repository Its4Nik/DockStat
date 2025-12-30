import { FetchBackendStatus } from "@Queries/fetchStatus"
import { useQuery } from "@tanstack/react-query"

export default function IndexPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["FetchBackendStatus-indexpage"],
    queryFn: FetchBackendStatus,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Something went wrong</div>

  return <p>{JSON.stringify(data)}</p>
}
