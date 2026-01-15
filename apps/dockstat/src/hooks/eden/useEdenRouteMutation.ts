import { extractEdenError } from "@dockstat/utils"
import type {
  EdenBody,
  EdenRoute,
  MutationResult,
  ResponseData,
  RouteBuilderOptions,
} from "./types"
import { useBaseEdenMutation } from "./useBaseEdenMutation"

export function useEdenRouteMutation<TParams, TRoute extends EdenRoute>(
  options: RouteBuilderOptions<TParams, TRoute>
): MutationResult<ResponseData<TRoute>, { params: TParams; body: EdenBody<TRoute> }> {
  const mutationFn = async (input: { params: TParams; body: EdenBody<TRoute> }) => {
    const routeFn = options.routeBuilder(input.params)
    const { data, error } = await routeFn(input.body as never)

    if (error) {
      throw new Error(extractEdenError({ error }))
    }

    if ((data as { success?: boolean })?.success === false) {
      throw new Error((data as { message?: string })?.message || extractEdenError({ data }))
    }

    return data as ResponseData<TRoute>
  }

  return useBaseEdenMutation<ResponseData<TRoute>, { params: TParams; body: EdenBody<TRoute> }>({
    mutationKey: options.mutationKey,
    mutationFn,
    invalidateQueries: options.invalidateQueries,
    toast: options.toast,
  })
}
