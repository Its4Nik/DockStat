import { extractEdenError } from "@dockstat/utils"
import { useQuery } from "@tanstack/react-query"

type EdenQueryRoute = (options?: {
  fetch?: RequestInit
  headers?: Record<string, unknown>
  query?: Record<string, unknown>
}) => Promise<{ data: unknown; error: unknown }>

type EdenData<T extends EdenQueryRoute> = Awaited<ReturnType<T>>["data"]

type UseEdenQueryOptions<TRoute extends EdenQueryRoute> = {
  route: TRoute
  queryKey: readonly unknown[]
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
  refetchOnWindowFocus?: boolean
}

export function useEdenQuery<TRoute extends EdenQueryRoute>({
  route,
  queryKey,
  enabled,
  staleTime,
  refetchInterval,
  refetchOnWindowFocus,
}: UseEdenQueryOptions<TRoute>) {
  type TData = NonNullable<EdenData<TRoute>>

  return useQuery<TData, Error>({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data, error } = await route({ fetch: { signal } })

      if (error) {
        throw new Error(extractEdenError({ error }))
      }

      return data as TData
    },
    enabled,
    staleTime,
    refetchInterval,
    refetchOnWindowFocus,
  })
}
