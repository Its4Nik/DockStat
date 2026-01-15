import { toast } from "@/lib/toast"
import { extractEdenError } from "@dockstat/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type BaseToastConfig<TData, TInput> = {
  successTitle: string | ((input: TInput, response: TData) => string)
  errorTitle: string | ((input: TInput, error: Error) => string)
}

export function useBaseEdenMutation<TData, TInput>(opts: {
  mutationKey: readonly string[]
  mutationFn: (input: TInput) => Promise<TData>
  invalidateQueries?: readonly string[][]
  toast?: BaseToastConfig<TData, TInput>
}) {
  const qc = useQueryClient()
  const { mutationKey, mutationFn, invalidateQueries = [], toast: toastConfig } = opts

  const mutation = useMutation({
    mutationKey,
    mutationFn,
    onSuccess: async (data, input) => {
      await Promise.all(invalidateQueries.map((key) => qc.invalidateQueries({ queryKey: key })))

      if (toastConfig) {
        toast({
          title:
            typeof toastConfig.successTitle === "function"
              ? toastConfig.successTitle(input, data)
              : toastConfig.successTitle,
          description: (data as { message?: string }).message,
          variant: "success",
        })
      }
    },
    onError: (error, input) => {
      if (toastConfig) {
        toast({
          title:
            typeof toastConfig.errorTitle === "function"
              ? toastConfig.errorTitle(input as TInput, error as Error)
              : toastConfig.errorTitle,
          description: extractEdenError({ error }),
          variant: "error",
        })
      }
    },
  })

  return {
    data: mutation.data as TData | undefined,
    error: mutation.error as Error | null,
    mutateAsync: mutation.mutateAsync as (input: TInput) => Promise<TData>,
    mutate: mutation.mutate as (input: TInput) => void,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  }
}
