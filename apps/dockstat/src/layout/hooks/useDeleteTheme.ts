import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export function useDeleteTheme() {
  const deleteThemeMutation = eden.useEdenMutation({
    mutationKey: ["deleteTheme"],
    route: api.themes.delete,
    toast: {
      successTitle: (input) => `Deleted theme ${input.id}`,
      errorTitle: (input) => `Could not delete theme ${input.id}`,
    },
  })

  const deleteTheme = async (id: number) => {
    await deleteThemeMutation.mutateAsync({ id })
  }

  return deleteTheme
}
