import { useEdenClient } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useWsTopics = () => {
  const eden = useEdenClient()

  const topicsQuery = eden.query({
    queryKey: ["ws-topics"],
    route: api.ws.topics.get,
  })

  return {
    topics: topicsQuery.data?.data ?? [],
    isLoading: topicsQuery.isLoading,
    topicsQuery,
  }
}
