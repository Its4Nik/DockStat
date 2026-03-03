import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useBaseEdenMutation<TData, TInput>(opts: {
  mutationKey: readonly string[]
  mutationFn: (input: TInput) => Promise<TData>
  invalidateQueries?: readonly string[][]
}) {
  const qc = useQueryClient()
  const { mutationKey, mutationFn, invalidateQueries = [] } = opts

  const mutation = useMutation<TData, Error, TInput>({
    mutationKey,
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidateQueries.map((key) => qc.invalidateQueries({ queryKey: key })))
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
