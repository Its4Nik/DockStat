import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const useConfigMutations = () => {
  const eden = useContext(EdenClientContext)

  const pinLinkMutation = eden.mutate({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["pinNavLink"],
    route: api.db.config.pinItem.post,
    toast: {
      errorTitle: (input) => `Could not pin ${input.path}`,
      successTitle: (input) => `Pinned ${input.path}`,
    },
  })

  const unpinLinkMutation = eden.mutate({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["unPinNavLink"],
    route: api.db.config.unpinItem.post,
    toast: {
      errorTitle: "Failed to unpin link",
      successTitle: "Link unpinned successfully",
    },
  })

  const updateAdditionalSettingsMutation = eden.mutate({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["updateAdditionalSettings"],
    route: api.db.config.additionalSettings.post,
    toast: {
      errorTitle: "Failed to update additional settings",
      successTitle: "Additional settings updated",
    },
  })

  const editHotkeyMutation = eden.mutate({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["editHotkey"],
    route: api.db.config.hotkey.post,
    toast: {
      errorTitle: "Failed to update hotkey",
      successTitle: "Hotkey updated successfully",
    },
  })

  return {
    editHotkeyMutation,
    pinLinkMutation,
    unpinLinkMutation,
    updateAdditionalSettingsMutation,
  }
}
