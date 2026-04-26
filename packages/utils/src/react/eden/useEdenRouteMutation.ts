import { extractDockStatError, extractEdenError } from "@dockstat/utils"
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
      const dockstatErr = extractDockStatError(error)
      const errorDescription = dockstatErr?.description ?? extractEdenError(error)

      if (toaster) {
        let description: ReactNode = errorDescription
        let title: ReactNode = null

        if (typeof options.toast?.toasts.errorDescription === "function") {
          description = options.toast?.toasts.errorDescription(
            input.body as EdenBody<TRoute>,
            dockstatErr ?? null
          )
        } else if (typeof options.toast?.toasts.errorDescription === "string") {
          description = options.toast.toasts.errorDescription
        }

        if (typeof options.toast?.toasts.errorTitle === "function") {
          title = options.toast?.toasts.errorTitle(input.body, dockstatErr ?? null)
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
      let title: ReactNode = ""
      let description: ReactNode = ""
      const responseData = data as ResponseData<TRoute>

      if (typeof options.toast?.toasts.successTitle === "function") {
        description = options.toast?.toasts.successTitle(input.body, responseData)
      } else if (typeof options.toast?.toasts.successTitle === "string") {
        description = options.toast.toasts.successTitle
      }

      if (typeof options.toast?.toasts.successDescription === "function") {
        title = options.toast?.toasts.successDescription(input.body, responseData)
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
