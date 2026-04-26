import { extractDockStatError, extractEdenError } from "@dockstat/utils"
import type { DirectRouteOptions, EdenBody, EdenRoute, MutationResult, ResponseData } from "./types"
import { useBaseEdenMutation } from "./useBaseEdenMutation"

export function useEdenMutation<TRoute extends EdenRoute>(
  options: DirectRouteOptions<TRoute>
): MutationResult<ResponseData<TRoute>, EdenBody<TRoute>> {
  const mutationFn = async (body: EdenBody<TRoute>) => {
    const toaster = options.toast?.toaster
    const { data, error } = await options.route(body as never, options.opts as never)

    if (error) {
      const dockstatErr = extractDockStatError(error)
      const errorDescription = dockstatErr?.description ?? extractEdenError(error)

      if (toaster) {
        let description: React.ReactNode = errorDescription
        let title: React.ReactNode = ""

        if (typeof options.toast?.toasts.errorDescription === "function") {
          description = options.toast?.toasts.errorDescription(body, dockstatErr ?? null)
        } else if (typeof options.toast?.toasts.errorDescription === "string") {
          description = options.toast.toasts.errorDescription
        }

        if (typeof options.toast?.toasts.errorTitle === "function") {
          title = options.toast?.toasts.errorTitle(body, dockstatErr ?? null)
        } else if (typeof options.toast?.toasts.errorTitle === "string") {
          title = options.toast.toasts.errorTitle
        }

        // Include reqId in toast description for tracking
        if (dockstatErr?.reqId && typeof description === "string") {
          description = `${description} (req: ${dockstatErr.reqId})`
        }

        toaster({ description, title, variant: "error" })
      }

      throw new Error(errorDescription)
    }

    if ((data as { success?: boolean })?.success === false) {
      const dockstatErr = extractDockStatError(data)
      throw new Error(
        dockstatErr?.description ??
          (data as { message?: string })?.message ??
          extractEdenError({ data })
      )
    }

    if (toaster) {
      let title: React.ReactNode = ""
      let description: React.ReactNode = ""
      const responseData = data as ResponseData<TRoute>

      if (typeof options.toast?.toasts.successTitle === "function") {
        description = options.toast?.toasts.successTitle(body, responseData)
      } else if (typeof options.toast?.toasts.successTitle === "string") {
        description = options.toast.toasts.successTitle
      }

      if (typeof options.toast?.toasts.successDescription === "function") {
        title = options.toast?.toasts.successDescription(body, responseData)
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
