import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useBaseEdenMutation<TData, TInput>(opts: {
  mutationKey: readonly string[]
  mutationFn: (input: TInput) => Promise<TData>
  invalidateQueries?: readonly string[][]
}) {
  const qc = useQueryClient()
  const { mutationKey, mutationFn, invalidateQueries = [] } = opts

  const mutation = useMutation({
    mutationKey,
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidateQueries.map((key) => qc.invalidateQueries({ queryKey: key })))
    },
    onError: () => {},
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
