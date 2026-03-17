import { api } from "@/lib/api";
import { eden } from "@dockstat/utils/react";

export const useDockerHostMutations = () => {
  const createHostMutation = eden.useEdenMutation({
    mutationKey: ["addHost"],
    route: api.docker.hosts.post,
    invalidateQueries: [["fetchHosts"]],
    toast: {
      successTitle: (h) => `Added Host: ${h.name}`,
      errorTitle: (h) => `Could not add Host: ${h.name}`,
    },
  });

  const updateHostMutation = eden.useEdenMutation({
    mutationKey: ["updateHost"],
    route: api.docker.hosts.patch,
    invalidateQueries: [["fetchHosts"]],
    toast: {
      successTitle: (h) => `Updated Host: ${h.host.id} (Client: ${h.clientId})`,
      errorTitle: (h) =>
        `Could not update Host: ${h.host.id} (Client: ${h.clientId})`,
    },
  });

  const deleteHostMutation = eden.useEdenMutation({
    mutationKey: ["deleteHost"],
    route: api.docker.hosts.delete,
    invalidateQueries: [["fetchHosts"]],
    toast: {
      successTitle: (h) => `Deleted Host: ${h.hostId} (Client: ${h.clientId})`,
      errorTitle: (h) =>
        `Could not delete Host: ${h.hostId} (Client: ${h.clientId})`,
    },
  });

  return {
    createHostMutation,
    updateHostMutation,
    deleteHostMutation,
  };
};
