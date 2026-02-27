import { extractEdenError } from "@dockstat/utils"
import type {
  EdenBody,
  EdenRoute,
  MutationResult,
  ResponseData,
  RouteBuilderOptions,
} from "./types"
import { useBaseEdenMutation } from "./useBaseEdenMutation"

/**
 * High level mutation hook for Eden routes with params.
 *
 * This hook wraps an Eden route builder and connects it to React Query mutation handling.
 * It automatically:
 * - calls the generated Eden route
 * - normalizes Eden errors
 * - throws when `{ success: false }` responses occur
 * - invalidates configured queries
 * - shows success/error toasts
 *
 * The hook is designed for endpoints that look like:
 *   api.users({ id }).patch(body)
 *   api.projects({ projectId }).delete()
 *
 * @template TParams Route params type passed into the route builder
 * @template TRoute Eden route type returned by the builder
 *
 * @param options Configuration for building and executing the route mutation
 * @param options.mutationKey Unique react-query mutation key
 * @param options.routeBuilder Function that receives params and returns an Eden route handler
 * @param options.invalidateQueries Query keys to invalidate after success
 * @param options.toast Optional toast configuration
 *
 * @returns MutationResult containing mutate/mutateAsync and state flags
 *
 * @example
 * const updateUser = useEdenRouteMutation({
 *   mutationKey: ["users", "update"],
 *   routeBuilder: ({ id }) => api.users({ id }).patch,
 *   invalidateQueries: [["users"]],
 *   toast: {
 *     successTitle: "User updated",
 *     errorTitle: "Failed to update user"
 *   }
 * })
 *
 * updateUser.mutate({
 *   params: { id: "123" },
 *   body: { name: "John" }
 * })
 */
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
