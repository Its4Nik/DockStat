import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const useDockerHostMutations = () => {
  const eden = useContext(EdenClientContext)

  const createHostMutation = eden.mutate({
    invalidateQueries: [["fetchHosts"]],
    mutationKey: ["addHost"],
    route: api.docker.hosts.post,
    toast: {
      errorTitle: (h) => `Could not add Host: ${h.name}`,
      successTitle: (h) => `Added Host: ${h.name}`,
    },
  })

  const updateHostMutation = eden.mutate({
    invalidateQueries: [["fetchHosts"]],
    mutationKey: ["updateHost"],
    route: api.docker.hosts.patch,
    toast: {
      errorTitle: (h) => `Could not update Host: ${h.host.id} (Client: ${h.clientId})`,
      successTitle: (h) => `Updated Host: ${h.host.id} (Client: ${h.clientId})`,
    },
  })

  const deleteHostMutation = eden.mutate({
    invalidateQueries: [["fetchHosts"]],
    mutationKey: ["deleteHost"],
    route: api.docker.hosts.delete,
    toast: {
      errorTitle: (h) => `Could not delete Host: ${h.hostId} (Client: ${h.clientId})`,
      successTitle: (h) => `Deleted Host: ${h.hostId} (Client: ${h.clientId})`,
    },
  })

  return {
    createHostMutation,
    deleteHostMutation,
    updateHostMutation,
  }
}
