import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useAddRepoMutation = () =>
  eden.useEdenMutation({
    invalidateQueries: [["fetchAllRepositories"]],
    mutationKey: ["addRepo"],
    route: api.db.repositories.post,
    toast: {
      errorTitle: () => "Could not add repository",
      successTitle: () => "Repository added",
    },
  })

export const useDeleteRepoMutation = (id: number, name: string) =>
  eden.useEdenMutation({
    invalidateQueries: [["fetchAllRepositories"]],
    mutationKey: ["deleteRepo"],
    route: api.db.repositories({ id }).delete,
    toast: {
      errorTitle: `Could not delete repository`,
      successTitle: `Deleted ${name}`,
    },
  })
