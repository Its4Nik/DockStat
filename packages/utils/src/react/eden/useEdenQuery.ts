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

  console.debug(
    `[useEdenQuery] enabled=${enabled}, skipAuthHandler=${skipAuthHandler ?? false}, onUnauthorized=${onUnauthorized ? "set" : "unset"}`
  )

  return useQuery<TData, Error>({
    enabled,
    queryFn: async ({ signal }) => {
      console.debug("[useEdenQuery] fetching:", queryKey)
      const { data, error, status } = await route({ fetch: { signal }, ...opts })

      console.debug("[useEdenQuery] response:", { status, hasError: Boolean(error) })

      if (!skipAuthHandler && status === 401 && onUnauthorized) {
        console.debug("[useEdenQuery] 401 received, triggering onUnauthorized")
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
