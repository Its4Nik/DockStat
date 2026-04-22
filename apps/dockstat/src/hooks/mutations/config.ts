import { eden } from "@dockstat/utils/react"
import { api, getAuthHeaders } from "@/lib/api"

export const useConfigMutations = () => {
  const pinLinkMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["pinNavLink"],
    opts: {
      headers: getAuthHeaders(),
    },
    route: api.db.config.pinItem.post,
    toast: {
      errorTitle: "Failed to pin link",
      successTitle: "Link pinned successfully",
    },
  })

  const unpinLinkMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["unPinNavLink"],
    opts: {
      headers: getAuthHeaders(),
    },
    route: api.db.config.unpinItem.post,
    toast: {
      errorTitle: "Failed to unpin link",
      successTitle: "Link unpinned successfully",
    },
  })

  const updateAdditionalSettingsMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["updateAdditionalSettings"],
    opts: {
      headers: getAuthHeaders(),
    },
    route: api.db.config.additionalSettings.post,
    toast: {
      errorTitle: "Failed to update additional settings",
      successTitle: "Additional settings updated",
    },
  })

  const editHotkeyMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchAdditionalSettings"]],
    mutationKey: ["editHotkey"],
    opts: {
      headers: getAuthHeaders(),
    },
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
