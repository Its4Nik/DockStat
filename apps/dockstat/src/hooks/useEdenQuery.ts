import { type UseQueryOptions, useQuery } from "@tanstack/react-query"
import type { EdenData, EdenQueryData, EdenQueryRoute, UseEdenQueryOptions } from "./eden/types"
import { createEdenQueryFn } from "./eden/helper"

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
    queryFn: createEdenQueryFn(route),
    enabled,
    staleTime,
    refetchInterval,
    refetchOnWindowFocus,
  })
}
/* An alias for useEdenQuery
 * use .refetch() for calling it programmatically
 */
export function edenQuery<TRoute extends EdenQueryRoute>(
  opts: Omit<UseEdenQueryOptions<TRoute>, "enabled">,
  tanstackOpts?: Omit<
    UseQueryOptions<
      NonNullable<EdenData<TRoute>>,
      Error,
      NonNullable<EdenData<TRoute>>,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >
) {
  type TData = NonNullable<EdenData<TRoute>>

  return useQuery<TData, Error>({
    ...tanstackOpts,
    queryKey: opts.queryKey,
    queryFn: createEdenQueryFn(opts.route),
    enabled: false,
  })
}
