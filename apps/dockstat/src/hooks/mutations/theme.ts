import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useThemeMutations = () => {
  const createThemeMutation = eden.useEdenMutation({
    mutationKey: ["createTheme"],
    route: api.themes.post,
    invalidateQueries: [["fetchAllThemes"]],
    toast: {
      successTitle: (input) => `Created new Theme: ${input.name}`,
      errorTitle: (input) => `Could not create new Theme: ${input.name}`,
    },
  })

  const deleteThemeMutation = eden.useEdenMutation({
    mutationKey: ["deleteTheme"],
    route: api.themes.delete,
    invalidateQueries: [["fetchAllThemes"]],
    toast: {
      successTitle: (input) => `Deleted theme ${input.id}`,
      errorTitle: (input) => `Could not delete theme ${input.id}`,
    },
  })

  return {
    createThemeMutation,
    deleteThemeMutation,
  }
}
