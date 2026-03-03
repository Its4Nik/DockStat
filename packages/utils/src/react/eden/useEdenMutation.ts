import type {
  DirectRouteOptions,
  EdenBody,
  EdenRoute,
  MutationResult,
  ResponseData,
  RouteBuilderOptions,
} from "./types"
import { useBaseEdenMutation } from "./useBaseEdenMutation"
import { handleEdenMutation } from "./utils"

// Overload 1: Direct Route
export function useEdenMutation<TRoute extends EdenRoute>(
  options: DirectRouteOptions<TRoute>
): MutationResult<ResponseData<TRoute>, EdenBody<TRoute>>

// Overload 2: Route Builder
export function useEdenMutation<TParams, TRoute extends EdenRoute>(
  options: RouteBuilderOptions<TParams, TRoute>
): MutationResult<ResponseData<TRoute>, { params: TParams; body: EdenBody<TRoute> }>

// Implementation (No generics - avoids signature mismatch)
export function useEdenMutation(
  options: DirectRouteOptions<EdenRoute> | RouteBuilderOptions<unknown, EdenRoute>
) {
  // biome-ignore lint/suspicious/noExplicitAny: Needed for Overload
  return useBaseEdenMutation<any, any>({
    mutationKey: options.mutationKey,
    mutationFn: async (input) => {
      let route: EdenRoute
      let body: unknown

      // Determine route and body based on options provided
      if ("routeBuilder" in options && options.routeBuilder) {
        // Input is { params, body }
        const { params, body: b } = input as { params: unknown; body: unknown }
        route = options.routeBuilder(params)
        body = b
      } else {
        // Input is just body
        route = options.route
        body = input
      }

      const promise = route(body as never)

      // Cast result for the handler
      return handleEdenMutation(
        // biome-ignore lint/suspicious/noExplicitAny: Needed for Overload
        promise as Promise<{ data: any; error: unknown }>
      )
    },
    invalidateQueries: options.invalidateQueries,
  })
}
