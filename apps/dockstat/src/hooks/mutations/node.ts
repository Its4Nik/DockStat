import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useDockNodeMutations = () => {
  const createDockNodeMutation = eden.useEdenMutation({
    invalidateQueries: [["getAllDockNodes"]],
    mutationKey: ["createDockNode"],
    route: api.node.post,
    toast: {
      errorTitle: (dn) => `${dn?.name || "DockNode"} could not be created`,
      successTitle: (dn) => `${dn?.name || "DockNode"} created`,
    },
  })

  const deleteDockNodeMutation = eden.useEdenMutation({
    invalidateQueries: [["getAllDockNodes"]],
    mutationKey: ["deleteDockNode"],
    route: api.node.delete,
    toast: {
      errorTitle: (dn) => `${dn?.id || "DockNode"} could not be deleted`,
      successTitle: (dn) => `${dn?.id || "DockNode"} deleted`,
    },
  })

  return { createDockNodeMutation, deleteDockNodeMutation }
}
