import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const useAccountsMutations = () => {
  const eden = useContext(EdenClientContext)

  // Delete user mutation (has path parameter)
  const deleteUserMutation = eden.mutateRoute({
    invalidateQueries: [["fetchUsers"]],
    mutationKey: ["deleteUser"],
    routeBuilder: ({ userId }: { userId: string }) => api.auth.users({ userId }).delete,
    toast: {
      errorTitle: () => "Failed to delete user",
      successTitle: () => "User deleted successfully",
    },
  })

  // Create provider mutation (no path parameters)
  const createProviderMutation = eden.mutate({
    invalidateQueries: [["fetchProviders"]],
    mutationKey: ["createProvider"],
    route: api.auth.providers.post,
    toast: {
      errorTitle: () => "Failed to create OAuth provider",
      successTitle: () => "OAuth provider created successfully",
    },
  })

  // Delete provider mutation (has path parameter)
  const deleteProviderMutation = eden.mutateRoute({
    invalidateQueries: [["fetchProviders"]],
    mutationKey: ["deleteProvider"],
    routeBuilder: ({ providerId }: { providerId: string }) =>
      api.auth.providers({ providerId }).delete,
    toast: {
      errorTitle: () => "Failed to delete provider",
      successTitle: () => "OAuth provider deleted successfully",
    },
  })

  // Create API key mutation (no path parameters)
  const createApiKeyMutation = eden.mutate({
    invalidateQueries: [["fetchApiKeys"]],
    mutationKey: ["createApiKey"],
    route: api.auth["api-keys"].post,
    toast: {
      errorTitle: () => "Failed to create API key",
      successTitle: () => "API key created successfully",
    },
  })

  // Delete API key mutation (has path parameter)
  const deleteApiKeyMutation = eden.mutateRoute({
    invalidateQueries: [["fetchApiKeys"]],
    mutationKey: ["deleteApiKey"],
    routeBuilder: ({ id }: { id: string }) => api.auth["api-keys"]({ id }).delete,
    toast: {
      errorTitle: () => "Failed to delete API key",
      successTitle: () => "API key deleted successfully",
    },
  })

  return {
    createApiKeyMutation,
    createProviderMutation,
    deleteApiKeyMutation,
    deleteProviderMutation,
    deleteUserMutation,
  }
}
