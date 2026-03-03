import { useQuery } from "@tanstack/react-query";
import { createEdenQueryFn } from "./eden/helper";
import type {
  EdenData,
  EdenQueryRoute,
  UseEdenQueryOptions,
} from "./eden/types";

export function useEdenQuery<TRoute extends EdenQueryRoute>(
  opts: UseEdenQueryOptions<TRoute>,
) {
  type TData = NonNullable<EdenData<TRoute>>;

  return useQuery<TData, Error>({
    ...opts,
    queryKey: opts.queryKey,
    queryFn: createEdenQueryFn(opts.route),
  });
}

/*
 * An alias for useEdenQuery
 * use .refetch() for calling it programmatically
 */
export function edenQuery<TRoute extends EdenQueryRoute>(
  opts: Omit<UseEdenQueryOptions<TRoute>, "enabled">,
) {
  return useEdenQuery<TRoute>({
    ...opts,
    enabled: false,
  });
}
