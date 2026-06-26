import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const useDockerClientMutations = () => {
  const eden = useContext(EdenClientContext)

  const deleteClientMutation = eden.mutate({
    invalidateQueries: [["fetchDockerClients"], ["fetchPoolStatus"]],
    mutationKey: ["deleteClient"],
    route: api.docker.client.delete,
    toast: {
      errorTitle: (input) => `Could not delete client ${input.clientId}`,
      successTitle: (input) => `Delted Client ${input.clientId}`,
    },
  })

  const createClientMutation = eden.mutate({
    invalidateQueries: [["fetchDockerClients"], ["fetchPoolStatus"]],
    mutationKey: ["createClient"],
    route: api.docker.client.post,
    toast: {
      errorTitle: (input) => `Could not create Client ${input.clientName}`,
      successTitle: (input) => `Created client ${input.clientName}`,
    },
  })

  const updateClientMutation = eden.mutate({
    mutationKey: ["updateClient"],
    route: api.docker.client.patch,
    toast: {
      errorTitle: (input) => `Could not update Client ${input.clientId}`,
      successTitle: (input) => `Updated Client ${input.clientId}`,
    },
  })

  return {
    createClientMutation,
    deleteClientMutation,
    updateClientMutation,
  }
}
