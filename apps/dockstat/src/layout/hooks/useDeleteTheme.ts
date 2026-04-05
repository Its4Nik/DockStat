import { useThemeMutations } from "@/hooks/mutations"

export function useDeleteTheme() {
  const { deleteThemeMutation } = useThemeMutations()

  const deleteTheme = async (id: number) => {
    await deleteThemeMutation.mutateAsync({ id })
  }

  return deleteTheme
}
