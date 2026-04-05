import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useDockNodeMutations = () => {
  const createDockNodeMutation = eden.useEdenMutation({
    route: api.node.post,
    mutationKey: ["createDockNode"],
    invalidateQueries: [["getAllDockNodes"]],
    toast: {
      errorTitle: (dn) => `${dn?.name || "DockNode"} could not be created`,
      successTitle: (dn) => `${dn?.name || "DockNode"} created`,
    },
  })

  const deleteDockNodeMutation = eden.useEdenMutation({
    route: api.node.delete,
    mutationKey: ["deleteDockNode"],
    invalidateQueries: [["getAllDockNodes"]],
    toast: {
      errorTitle: (dn) => `${dn?.id || "DockNode"} could not be deleted`,
      successTitle: (dn) => `${dn?.id || "DockNode"} deleted`,
    },
  })

  return { createDockNodeMutation, deleteDockNodeMutation }
}
