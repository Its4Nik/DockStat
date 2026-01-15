import { extractEdenError } from "@dockstat/utils"
import type { DirectRouteOptions, EdenBody, EdenRoute, MutationResult, ResponseData } from "./types"
import { useBaseEdenMutation } from "./useBaseEdenMutation"

export function useEdenMutation<TRoute extends EdenRoute>(
  options: DirectRouteOptions<TRoute>
): MutationResult<ResponseData<TRoute>, EdenBody<TRoute>> {
  const mutationFn = async (body: EdenBody<TRoute>) => {
    const { data, error } = await options.route(body as never)

    if (error) {
      throw new Error(extractEdenError({ error }))
    }

    if ((data as { success?: boolean })?.success === false) {
      throw new Error((data as { message?: string })?.message || extractEdenError({ data }))
    }

    return data as ResponseData<TRoute>
  }

  return useBaseEdenMutation<ResponseData<TRoute>, EdenBody<TRoute>>({
    mutationKey: options.mutationKey,
    mutationFn,
    invalidateQueries: options.invalidateQueries,
    toast: options.toast,
  })
}
