export type EdenRoute = (...args: never[]) => Promise<{ data: unknown; error: unknown }>
export type EdenData<T extends EdenRoute> = Awaited<ReturnType<T>>["data"]

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
}

export type EdenBody<T extends EdenRoute> = Parameters<T> extends []
  ? // biome-ignore lint/suspicious/noConfusingVoidType: must be used for correct type propagation
    void
  : unknown extends Parameters<T>[0]
    ? // biome-ignore lint/suspicious/noConfusingVoidType: must be used for correct type propagation
      void
    : Parameters<T>[0]

export type ToastConfig<TData, TInput> = {
  successTitle: string | ((input: TInput, response: TData) => string)
  errorTitle: string | ((input: TInput, error: Error) => string)
}

export type ResponseData<TRoute extends EdenRoute> = NonNullable<EdenData<TRoute>> & {
  message: string
}

// Direct route - no params needed at mutation time
export type DirectRouteOptions<TRoute extends EdenRoute> = {
  route: TRoute
  routeBuilder?: never
  mutationKey: readonly string[]
  invalidateQueries?: readonly string[][]
  toast?: ToastConfig<ResponseData<TRoute>, EdenBody<TRoute>>
}

// Route builder - params passed at mutation time
export type RouteBuilderOptions<TParams, TRoute extends EdenRoute> = {
  route?: never
  routeBuilder: (params: TParams) => TRoute
  mutationKey: readonly string[]
  invalidateQueries?: readonly string[][]
  toast?: ToastConfig<ResponseData<TRoute>, { params: TParams; body: EdenBody<TRoute> }>
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
