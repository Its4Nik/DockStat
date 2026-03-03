import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export function usePinMutations() {
  const pinMutation = eden.useEdenMutation({
    mutationKey: ["pinNavLink"],
    route: api.db.config.pinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
  })

  const unPinMutation = eden.useEdenMutation({
    mutationKey: ["unPinNavLink"],
    route: api.db.config.unpinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
  })

  return { pinMutation, unPinMutation }
}
