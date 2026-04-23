import { eden } from "@dockstat/utils/react"
import { api, getAuthHeaders } from "@/lib/api"

export const useCreateUserMutations = () => {
  const registerLocalUser = eden.useEdenMutation({
    mutationKey: ["registerLocalUser"],
    opts: {
      headers: getAuthHeaders(),
    },
    route: api.auth.local.register.post,
  })

  return {
    registerLocalUser,
  }
}
