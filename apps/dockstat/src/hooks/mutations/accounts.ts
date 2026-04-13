import { eden } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useAccountMutations = () => {
  // API Key Mutations
  const createApiKeyMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchApiKeys"]],
    mutationKey: ["createApiKey"],
    route: api.auth["api-key"].create.post,
    toast: {
      errorTitle: "Failed to create API key",
      successTitle: "API key created successfully",
    },
  })

  const deleteApiKeyMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchApiKeys"]],
    mutationKey: ["deleteApiKey"],
    route: api.auth["api-key"].delete,
    toast: {
      errorTitle: "Failed to delete API key",
      successTitle: "API key deleted successfully",
    },
  })

  const updateApiKeyMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchApiKeys"]],
    mutationKey: ["updateApiKey"],
    route: api.auth["api-key"].update.post,
    toast: {
      errorTitle: "Failed to update API key",
      successTitle: "API key updated successfully",
    },
  })

  // User Mutations
  const createUserMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchUsers"], ["fetchAccounts"]],
    mutationKey: ["createUser"],
    route: api.auth["sign-up"].post,
    toast: {
      errorTitle: "Failed to create user",
      successTitle: "User created successfully",
    },
  })

  const updateUserMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchUsers"]],
    mutationKey: ["updateUser"],
    route: api.auth.user.patch,
    toast: {
      errorTitle: "Failed to update user",
      successTitle: "User updated successfully",
    },
  })

  const deleteUserMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchUsers"], ["fetchAccounts"]],
    mutationKey: ["deleteUser"],
    route: api.auth.user.delete,
    toast: {
      errorTitle: "Failed to delete user",
      successTitle: "User deleted successfully",
    },
  })

  const banUserMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchUsers"]],
    mutationKey: ["banUser"],
    route: api.auth.admin.ban.post,
    toast: {
      errorTitle: "Failed to ban user",
      successTitle: "User banned successfully",
    },
  })

  const unbanUserMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchUsers"]],
    mutationKey: ["unbanUser"],
    route: api.auth.admin.unban.post,
    toast: {
      errorTitle: "Failed to unban user",
      successTitle: "User unbanned successfully",
    },
  })

  const updateUserRoleMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchUsers"]],
    mutationKey: ["updateUserRole"],
    route: api.auth.admin.role.post,
    toast: {
      errorTitle: "Failed to update user role",
      successTitle: "User role updated successfully",
    },
  })

  // OAuth Provider Mutations
  const addOAuthProviderMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchOAuthProviders"]],
    mutationKey: ["addOAuthProvider"],
    route: api.auth.oauth.add.post,
    toast: {
      errorTitle: "Failed to add OAuth provider",
      successTitle: "OAuth provider added successfully",
    },
  })

  const removeOAuthProviderMutation = eden.useEdenMutation({
    invalidateQueries: [["fetchOAuthProviders"]],
    mutationKey: ["removeOAuthProvider"],
    route: api.auth.oauth.remove.post,
    toast: {
      errorTitle: "Failed to remove OAuth provider",
      successTitle: "OAuth provider removed successfully",
    },
  })

  return {
    // OAuth
    addOAuthProviderMutation,
    // Users
    banUserMutation,
    // API Key
    createApiKeyMutation,
    createUserMutation,
    deleteApiKeyMutation,
    deleteUserMutation,
    removeOAuthProviderMutation,
    unbanUserMutation,
    updateApiKeyMutation,
    updateRoleMutation: updateUserRoleMutation,
    updateUserMutation,
  }
}
