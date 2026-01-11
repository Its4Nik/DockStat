import { extractEdenError } from "@dockstat/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/lib/toast"

type EdenRoute = (...args: never[]) => Promise<{ data: unknown; error: unknown }>
type EdenData<T extends EdenRoute> = Awaited<ReturnType<T>>["data"]

type EdenInput<T extends EdenRoute> = Parameters<T> extends []
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

type BaseOptions<TRoute extends EdenRoute> = {
  route: TRoute
  mutationKey: readonly string[]
  invalidateQueries?: readonly string[][]
  toast?: ToastConfig<NonNullable<EdenData<TRoute>> & { message: string }, EdenInput<TRoute>>
}

export function useEdenMutation<TRoute extends EdenRoute>({
  route,
  mutationKey,
  invalidateQueries = [],
  toast: toastConfig,
}: BaseOptions<TRoute>) {
  const qc = useQueryClient()

  type TData = NonNullable<EdenData<TRoute>> & { message: string }
  type TInput = EdenInput<TRoute>

  const mutation = useMutation<TData, Error, TInput>({
    mutationKey,
    mutationFn: async (input) => {
      const { data, error } = await (route as unknown as (arg?: TInput) => ReturnType<TRoute>)(
        input
      )

      if (error) {
        throw new Error(extractEdenError({ error }))
      }

      if (data?.success === false) {
        throw new Error(data?.message || extractEdenError({ data }))
      }

      return data as TData
    },
    onSuccess: async (data, input) => {
      await Promise.all(invalidateQueries.map((key) => qc.invalidateQueries({ queryKey: key })))

      if (toastConfig) {
        toast({
          title:
            typeof toastConfig.successTitle === "function"
              ? toastConfig.successTitle(input, data)
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
              ? toastConfig.errorTitle(input, error)
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
