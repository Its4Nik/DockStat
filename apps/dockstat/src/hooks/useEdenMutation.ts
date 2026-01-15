import { extractEdenError } from "@dockstat/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/lib/toast"

type EdenRoute = (...args: never[]) => Promise<{ data: unknown; error: unknown }>
type EdenData<T extends EdenRoute> = Awaited<ReturnType<T>>["data"]

type EdenBody<T extends EdenRoute> = Parameters<T> extends []
  ? // biome-ignore lint/suspicious/noConfusingVoidType: must be used for correct type propagation
    void
  : unknown extends Parameters<T>[0]
    ? // biome-ignore lint/suspicious/noConfusingVoidType: must be used for correct type propagation
      void
    : Parameters<T>[0]

type ToastConfig<TData, TInput> = {
  successTitle: string | ((input: TInput, response: TData) => string)
  errorTitle: string | ((input: TInput, error: Error) => string)
}

type ResponseData<TRoute extends EdenRoute> = NonNullable<EdenData<TRoute>> & {
  message: string
}

// Direct route - no params needed at mutation time
type DirectRouteOptions<TRoute extends EdenRoute> = {
  route: TRoute
  routeBuilder?: never
  mutationKey: readonly string[]
  invalidateQueries?: readonly string[][]
  toast?: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
}

// Route builder - params passed at mutation time
type RouteBuilderOptions<TParams, TRoute extends EdenRoute> = {
  route?: never
  routeBuilder: (params: TParams) => TRoute
  mutationKey: readonly string[]
  invalidateQueries?: readonly string[][]
  toast?: ToastConfig<ResponseData<TRoute>, { params: TParams; body: EdenBody<TRoute> }>
}

// Overload for direct route
export function useEdenMutation<TRoute extends EdenRoute>(
  options: DirectRouteOptions<TRoute>
): MutationResult<ResponseData<TRoute>, EdenBody<TRoute>>

// Overload for route builder with params
export function useEdenMutation<TParams, TRoute extends EdenRoute>(
  options: RouteBuilderOptions<TParams, TRoute>
): MutationResult<ResponseData<TRoute>, { params: TParams; body: EdenBody<TRoute> }>

// Implementation
export function useEdenMutation<TParams, TRoute extends EdenRoute>(
  options: DirectRouteOptions<TRoute> | RouteBuilderOptions<TParams, TRoute>
) {
  const qc = useQueryClient()
  const { mutationKey, invalidateQueries = [], toast: toastConfig } = options

  const mutation = useMutation({
    mutationKey,
    mutationFn: async (input: unknown) => {
      let routeFn: TRoute
      let body: unknown

      if ("routeBuilder" in options && options.routeBuilder) {
        const { params, body: inputBody } = input as { params: TParams; body: unknown }
        routeFn = options.routeBuilder(params)
        body = inputBody
      } else {
        routeFn = (options as DirectRouteOptions<TRoute>).route
        body = input
      }

      const { data, error } = await (routeFn as unknown as (arg?: unknown) => ReturnType<TRoute>)(
        body
      )

      if (error) {
        throw new Error(extractEdenError({ error }))
      }

      if ((data as { success?: boolean })?.success === false) {
        throw new Error((data as { message?: string })?.message || extractEdenError({ data }))
      }

      return data as ResponseData<TRoute>
    },
    onSuccess: async (data, input) => {
      await Promise.all(invalidateQueries.map((key) => qc.invalidateQueries({ queryKey: key })))

      if (toastConfig) {
        toast({
          title:
            typeof toastConfig.successTitle === "function"
              ? (toastConfig.successTitle as (i: unknown, d: unknown) => string)(input, data)
              : toastConfig.successTitle,
          description: data.message,
          variant: "success",
        })
      }
    },
    onError: (error, input) => {
      if (toastConfig) {
        toast({
          title:
            typeof toastConfig.errorTitle === "function"
              ? (toastConfig.errorTitle as (i: unknown, e: Error) => string)(input, error)
              : toastConfig.errorTitle,
          description: extractEdenError({ error }),
          variant: "error",
        })
      }
    },
  })

  return {
    data: mutation.data,
    error: mutation.error,
    mutateAsync: mutation.mutateAsync,
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  }
}

type MutationResult<TData, TInput> = {
  data: TData | undefined
  error: Error | null
  mutateAsync: (input: TInput) => Promise<TData>
  mutate: (input: TInput) => void
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}
