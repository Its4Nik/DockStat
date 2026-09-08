import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useBaseEdenMutation<TData, TInput>(opts: {
  mutationKey: readonly string[]
  mutationFn: (input: TInput) => Promise<TData>
  invalidateQueries?: readonly string[][]
}) {
  const qc = useQueryClient()
  const { mutationKey, mutationFn, invalidateQueries = [] } = opts

  const mutation = useMutation({
    mutationFn,
    mutationKey,
    onError: () => {
      console.debug("[useBaseEdenMutation] mutation error for key:", mutationKey)
    },
    onSuccess: async () => {
      console.debug("[useBaseEdenMutation] mutation success, invalidating:", invalidateQueries)
      await Promise.all(invalidateQueries.map((key) => qc.invalidateQueries({ queryKey: key })))
    },
  })

  return {
    data: mutation.data as TData | undefined,
    error: mutation.error as Error | null,
    isError: mutation.isError,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    mutate: mutation.mutate as (input: TInput) => void,
    mutateAsync: mutation.mutateAsync as (input: TInput) => Promise<TData>,
  }
}
