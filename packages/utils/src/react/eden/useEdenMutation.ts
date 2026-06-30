import { extractEdenError } from "@dockstat/utils"
import type { DirectRouteOptions, EdenBody, EdenRoute, MutationResult, ResponseData } from "./types"
import { useBaseEdenMutation } from "./useBaseEdenMutation"

export function useEdenMutation<TRoute extends EdenRoute>(
  options: DirectRouteOptions<TRoute>
): MutationResult<ResponseData<TRoute>, EdenBody<TRoute>> {
  const mutationFn = async (body: EdenBody<TRoute>) => {
    const toaster = options.toast?.toaster
    const { data, error } = await options.route(body as never, options.opts as never)

    if (error) {
      if (toaster) {
        let description: React.ReactNode = extractEdenError(error)
        let title: React.ReactNode = ""

        if (typeof options.toast?.toasts.errorDescription === "function") {
          description = options.toast?.toasts.errorDescription(body, error as Error)
        } else if (typeof options.toast?.toasts.errorDescription === "string") {
          description = options.toast.toasts.errorDescription
        }

        if (typeof options.toast?.toasts.errorTitle === "function") {
          title = options.toast?.toasts.errorTitle(body, error as Error)
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
      let title: React.ReactNode = ""
      let description: React.ReactNode = ""

      if (typeof options.toast?.toasts.successTitle === "function") {
        description = options.toast?.toasts.successTitle(body, error as Error)
      } else if (typeof options.toast?.toasts.successTitle === "string") {
        description = options.toast.toasts.successTitle
      }

      if (typeof options.toast?.toasts.successDescription === "function") {
        title = options.toast?.toasts.successDescription(body, error as Error)
      } else if (typeof options.toast?.toasts.successDescription === "string") {
        title = options.toast.toasts.successDescription
      }

      toaster({ description, title, variant: "success" })
    }

    return data as ResponseData<TRoute>
  }

  return useBaseEdenMutation<ResponseData<TRoute>, EdenBody<TRoute>>({
    invalidateQueries: options.invalidateQueries,
    mutationFn,
    mutationKey: options.mutationKey,
  })
}
