import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useConfigMutations = () => {
  const pinLinkMutation = eden.useEdenMutation({
    mutationKey: ["pinNavLink"],
    route: api.db.config.pinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      successTitle: "Link pinned successfully",
      errorTitle: "Failed to pin link",
    },
  })

  const unpinLinkMutation = eden.useEdenMutation({
    mutationKey: ["unPinNavLink"],
    route: api.db.config.unpinItem.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      successTitle: "Link unpinned successfully",
      errorTitle: "Failed to unpin link",
    },
  })

  const updateAdditionalSettingsMutation = eden.useEdenMutation({
    mutationKey: ["updateAdditionalSettings"],
    route: api.db.config.additionalSettings.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      successTitle: "Additional settings updated",
      errorTitle: "Failed to update additional settings",
    },
  })

  const editHotkeyMutation = eden.useEdenMutation({
    mutationKey: ["editHotkey"],
    route: api.db.config.hotkey.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      successTitle: "Hotkey updated successfully",
      errorTitle: "Failed to update hotkey",
    },
  })

  return {
    pinLinkMutation,
    unpinLinkMutation,
    updateAdditionalSettingsMutation,
    editHotkeyMutation,
  }
}
