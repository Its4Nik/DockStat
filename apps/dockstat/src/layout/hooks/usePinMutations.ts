import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { api } from "@/lib/api"

export function usePinMutations() {
  const pinMutation = useEdenMutation({
    mutationKey: ["pinNavLink"],
    route: api.db.config.pinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
  })

  const unPinMutation = useEdenMutation({
    mutationKey: ["unPinNavLink"],
    route: api.db.config.unpinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
  })

  return { pinMutation, unPinMutation }
}
