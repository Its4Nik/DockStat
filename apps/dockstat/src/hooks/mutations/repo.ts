import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useAddRepoMutation = () =>
  eden.useEdenMutation({
    route: api.db.repositories.post,
    mutationKey: ["addRepo"],
    invalidateQueries: [["fetchAllRepositories"]],
    toast: {
      errorTitle: () => "Could not add repository",
      successTitle: () => "Repository added",
    },
  })

export const useDeleteRepoMutation = (id: number, name: string) =>
  eden.useEdenMutation({
    route: api.db.repositories({ id }).delete,
    mutationKey: ["deleteRepo"],
    invalidateQueries: [["fetchAllRepositories"]],
    toast: {
      errorTitle: `Could not delete repository`,
      successTitle: `Deleted ${name}`,
    },
  })
