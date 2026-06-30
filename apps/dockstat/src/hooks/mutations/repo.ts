import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const useAddRepoMutation = () => {
  const eden = useContext(EdenClientContext)

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
  const eden = useContext(EdenClientContext)

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
