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
}: UseEdenQueryOptions<TRoute>) {
  type TData = NonNullable<EdenQueryData<TRoute>>

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
