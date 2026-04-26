import type { DockStatErrorBody } from "@dockstat/utils"

export type EdenRoute = (...args: never[]) => Promise<{ data: unknown; error: unknown }>
export type EdenData<T extends EdenRoute> = Awaited<ReturnType<T>>["data"]

export type EdenFetchOptions = {
  headers?: Record<string, unknown> | undefined
  query?: Record<string, unknown> | undefined
  fetch?: RequestInit | undefined
}

export type EdenQueryRoute = (options?: {
  fetch?: RequestInit
  headers?: Record<string, unknown>
  query?: Record<string, unknown>
}) => Promise<{ data: unknown; error: unknown }>

export type EdenQueryData<T extends EdenQueryRoute> = Awaited<ReturnType<T>>["data"]

export type UseEdenQueryOptions<TRoute extends EdenQueryRoute> = {
  route: TRoute
  queryKey: readonly unknown[]
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
  refetchOnWindowFocus?: boolean
  opts?: EdenFetchOptions
}

export type EdenBody<T extends EdenRoute> = Parameters<T> extends []
  ? // biome-ignore lint/suspicious/noConfusingVoidType: must be used for correct type propagation
    void
  : unknown extends Parameters<T>[0]
    ? // biome-ignore lint/suspicious/noConfusingVoidType: must be used for correct type propagation
      void
    : Parameters<T>[0]

export type ToastConfig<TData, TInput> = {
  successTitle: React.ReactNode | ((input: TInput, response: TData) => React.ReactNode)
  successDescription?: React.ReactNode | ((input: TInput, response: TData) => React.ReactNode)
  errorTitle:
    | React.ReactNode
    | ((input: TInput, error: DockStatErrorBody | null) => React.ReactNode)
  errorDescription?:
    | React.ReactNode
    | ((input: TInput, error: DockStatErrorBody | null) => React.ReactNode)
}

export type ResponseData<TRoute extends EdenRoute> = NonNullable<EdenData<TRoute>> & {
  message: string
}

export type ToasterFunction = (ctx: {
  description: React.ReactNode
  title: React.ReactNode
  variant?: "error" | "success"
}) => string | number

// Direct route - no params needed at mutation time
export type DirectRouteOptions<TRoute extends EdenRoute> = {
  route: TRoute
  routeBuilder?: never
  mutationKey: readonly string[]
  invalidateQueries?: readonly string[][]
  toast?: {
    toaster: ToasterFunction
    toasts: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
  }
  opts?: EdenFetchOptions
}

// Route builder - params passed at mutation time
export type RouteBuilderOptions<TParams, TRoute extends EdenRoute> = {
  route?: never
  routeBuilder: (params: TParams) => TRoute
  mutationKey: readonly string[]
  invalidateQueries?: readonly string[][]
  opts?: EdenFetchOptions
  toast?: {
    toaster: ToasterFunction
    toasts: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
  }
}

export type MutationResult<TData, TInput> = {
  data: TData | undefined
  error: Error | null
  mutateAsync: (input: TInput) => Promise<TData>
  mutate: (input: TInput) => void
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}
