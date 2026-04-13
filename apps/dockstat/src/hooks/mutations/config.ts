import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useConfigMutations = () => {
  const pinLinkMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["pinNavLink"],
    route: api.db.config.pinItem.post,
    toast: {
      errorTitle: "Failed to pin link",
      successTitle: "Link pinned successfully",
    },
  })

  const unpinLinkMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["unPinNavLink"],
    route: api.db.config.unpinItem.post,
    toast: {
      errorTitle: "Failed to unpin link",
      successTitle: "Link unpinned successfully",
    },
  })

  const updateAdditionalSettingsMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["updateAdditionalSettings"],
    route: api.db.config.additionalSettings.post,
    toast: {
      errorTitle: "Failed to update additional settings",
      successTitle: "Additional settings updated",
    },
  })

  const editHotkeyMutation = eden.useEdenMutation({
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
