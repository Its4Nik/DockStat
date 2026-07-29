import type { ProvidersTable } from "@dockstat/auth/types"
import { useEdenClient } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export function useProviders() {
  const eden = useEdenClient()

  const { data, error, isLoading, refetch } = eden.query({
    queryKey: ["auth-providers"],
    route: api.auth.providers.get,
    skipAuthHandler: true,
  })

  const providers: ProvidersTable[] = Array.isArray(data) ? data : []

  return {
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to load authentication providers"
      : null,
    loading: isLoading,
    providers,
    refetch,
  }
}
