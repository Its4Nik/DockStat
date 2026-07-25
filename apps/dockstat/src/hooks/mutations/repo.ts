import { useEdenClient } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useAddRepoMutation = () => {
  const eden = useEdenClient()

  return eden.mutate({
    invalidateQueries: [["fetchAllRepositories"]],
    mutationKey: ["addRepo"],
    route: api.db.repositories.post,
    toast: {
      errorTitle: () => "Could not add repository",
      successTitle: () => "Repository added",
    },
  })
}

export const useDeleteRepoMutation = (id: number, name: string) => {
  const eden = useEdenClient()

  return eden.mutate({
    invalidateQueries: [["fetchAllRepositories"]],
    mutationKey: ["deleteRepo"],
    route: api.db.repositories({ id }).delete,
    toast: {
      errorTitle: `Could not delete repository`,
      successTitle: `Deleted ${name}`,
    },
  })
}
