import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useDockerClientMutations = () => {
  const deleteClientMutation = eden.useEdenMutation({
    mutationKey: ["deleteClient"],
    route: api.docker.client.delete,
    invalidateQueries: [["fetchDockerClients"], ["fetchPoolStatus"]],
    toast: {
      errorTitle: (input) => `Could not delete client ${input.clientId}`,
      successTitle: (input) => `Delted Client ${input.clientId}`,
    },
  })

  const createClientMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchDockerClients"], ["fetchPoolStatus"]],
    mutationKey: ["createClient"],
    route: api.docker.client.post,
    toast: {
      errorTitle: (input) => `Could not create Client ${input.clientName}`,
      successTitle: (input) => `Created client ${input.clientName}`,
    },
  })

  const updateClientMutation = eden.useEdenMutation({
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
