import { eden } from "@dockstat/utils/react"
import { api, getAuthHeaders } from "@/lib/api"

export const useThemeMutations = () => {
  const createThemeMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAllThemes"]],
    mutationKey: ["createTheme"],
    opts: {
      headers: getAuthHeaders(),
    },
    route: api.themes.post,
    toast: {
      errorTitle: (input) => `Could not create new Theme: ${input.name}`,
      successTitle: (input) => `Created new Theme: ${input.name}`,
    },
  })

  const deleteThemeMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAllThemes"]],
    mutationKey: ["deleteTheme"],
    opts: {
      headers: getAuthHeaders(),
    },
    route: api.themes.delete,
    toast: {
      errorTitle: (input) => `Could not delete theme ${input.id}`,
      successTitle: (input) => `Deleted theme ${input.id}`,
    },
  })

  return {
    createThemeMutation,
    deleteThemeMutation,
  }
}
