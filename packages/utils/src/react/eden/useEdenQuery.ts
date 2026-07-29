import { extractEdenError } from "@dockstat/utils"
import { useQuery } from "@tanstack/react-query"
import type { EdenQueryData, EdenQueryRoute, UseEdenQueryOptions } from "./types"

export function useEdenQuery<TRoute extends EdenQueryRoute>({
  route,
  queryKey,
  enabled,
  staleTime,
  refetchInterval,
  refetchOnWindowFocus,
  opts,
  onUnauthorized,
  skipAuthHandler,
}: UseEdenQueryOptions<TRoute>) {
  type TData = NonNullable<EdenQueryData<TRoute>>

  return useQuery<TData, Error>({
    enabled,
    queryFn: async ({ signal }) => {
      const { data, error, status } = await route({ fetch: { signal }, ...opts })

      if (!skipAuthHandler && status === 401 && onUnauthorized) {
        onUnauthorized()
      }

      if (error) {
        throw new Error(extractEdenError({ error }))
      }

      return data as TData
    },
    queryKey,
    refetchInterval,
    refetchOnWindowFocus,
    staleTime,
  })
}
