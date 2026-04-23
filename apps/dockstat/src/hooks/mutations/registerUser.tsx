import { eden } from "@dockstat/utils/react"
import { api, getAuthHeaders } from "@/lib/api"
import { toast } from "@/lib/toast"

export const useCreateUserMutations = () => {
  const registerLocalUser = eden.useEdenMutation({
    mutationKey: ["registerLocalUser"],
    opts: {
      headers: getAuthHeaders(),
    },
    route: api.auth.local.register.post,
    toast: {
      toaster: toast,
      toasts: {
        errorDescription: (_, error) => `Error: ${error}`,
        errorTitle: (input) => `Error while registering local user ${input.name}`,
        successDescription: () => "",
        successTitle: (input) => `Created new Local User: ${input.name}`,
      },
    },
  })

  return {
    registerLocalUser,
  }
}
