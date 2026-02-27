import { extractEdenError } from "@dockstat/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/lib/toast"
import type { ToastConfig } from "./types"

/**
 * Low-level base mutation wrapper around React Query.
 *
 * This hook centralizes:
 * - toast handling
 * - query invalidation
 * - error extraction
 *
 * It should NOT be used directly for API calls.
 * Instead, higher abstractions (like useEdenRouteMutation) should build on top of it.
 *
 * @template TData Successful mutation response type
 * @template TInput Mutation input type
 *
 * @param opts Configuration options
 * @param opts.mutationKey Unique react-query mutation key
 * @param opts.mutationFn Async mutation function
 * @param opts.invalidateQueries List of query keys to invalidate on success
 * @param opts.toast Optional toast configuration
 *
 * @returns Simplified mutation object with typed helpers
 *
 * @example
 * const mutation = useBaseEdenMutation({
 *   mutationKey: ["custom"],
 *   mutationFn: async (input) => doSomething(input),
 *   invalidateQueries: [["list"]],
 *   toast: { successTitle: "Saved", errorTitle: "Failed" }
 * })
 */
export function useBaseEdenMutation<TData, TInput>(opts: {
  mutationKey: readonly string[]
  mutationFn: (input: TInput) => Promise<TData>
  invalidateQueries?: readonly string[][]
  toast?: ToastConfig<TData, TInput>
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
