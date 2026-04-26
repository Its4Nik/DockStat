import { extractDockStatError, extractEdenError } from "@dockstat/utils"
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
}: UseEdenQueryOptions<TRoute>) {
  type TData = NonNullable<EdenQueryData<TRoute>>

  return useQuery<TData, Error>({
    enabled,
    queryFn: async ({ signal }) => {
      const { data, error } = await route({ fetch: { signal }, ...opts })

      if (error) {
        const dockstatErr = extractDockStatError(error)
        const message = dockstatErr?.description ?? extractEdenError({ error })
        const reqId = dockstatErr?.reqId
        throw new Error(reqId ? `${message} (req: ${reqId})` : message)
      }

      return data as TData
    },
    queryKey,
    refetchInterval,
    refetchOnWindowFocus,
    staleTime,
  })
}
