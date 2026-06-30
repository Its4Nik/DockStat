import { extractEdenError } from "@dockstat/utils"
import type { ReactNode } from "react"
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
    const toaster = options.toast?.toaster
    const routeFn = options.routeBuilder(input.params)
    const { data, error } = await routeFn(input.body as never, options.opts as never)

    if (error) {
      if (toaster) {
        let description: ReactNode = extractEdenError(error)
        let title: ReactNode = null

        if (typeof options.toast?.toasts.errorDescription === "function") {
          description = options.toast?.toasts.errorDescription(
            input.body as EdenBody<TRoute>,
            error as Error
          )
        } else if (typeof options.toast?.toasts.errorDescription === "string") {
          description = options.toast.toasts.errorDescription
        }

        if (typeof options.toast?.toasts.errorTitle === "function") {
          title = options.toast?.toasts.errorTitle(input.body, error as Error)
        } else if (typeof options.toast?.toasts.errorTitle === "string") {
          title = options.toast.toasts.errorTitle
        }

        toaster({ description, title, variant: "error" })
      }

      throw new Error(extractEdenError({ error }))
    }

    if ((data as { success?: boolean })?.success === false) {
      throw new Error((data as { message?: string })?.message || extractEdenError({ data }))
    }

    if (toaster) {
      let title: ReactNode = ""
      let description: ReactNode = ""

      if (typeof options.toast?.toasts.successTitle === "function") {
        description = options.toast?.toasts.successTitle(input.body, error as Error)
      } else if (typeof options.toast?.toasts.successTitle === "string") {
        description = options.toast.toasts.successTitle
      }

      if (typeof options.toast?.toasts.successDescription === "function") {
        title = options.toast?.toasts.successDescription(input.body, error as Error)
      } else if (typeof options.toast?.toasts.successDescription === "string") {
        title = options.toast.toasts.successDescription
      }

      toaster({ description, title, variant: "success" })
    }

    return data as ResponseData<TRoute>
  }

  return useBaseEdenMutation<ResponseData<TRoute>, { params: TParams; body: EdenBody<TRoute> }>({
    invalidateQueries: options.invalidateQueries,
    mutationFn,
    mutationKey: options.mutationKey,
  })
}
