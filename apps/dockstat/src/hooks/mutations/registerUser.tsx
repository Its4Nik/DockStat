import { useEdenClient } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export const useCreateUserMutations = () => {
  const eden = useEdenClient()

  const registerLocalUser = eden.mutate({
    invalidateQueries: [["fetchUsers"]],
    mutationKey: ["registerLocalUser"],
    route: api.auth.local.register.post,
    toast: {
      errorDescription: (_input, response) => `${response.message}`,
      errorTitle: (input) => `Error while registering local user ${input.name}`,
      successDescription: () => "",
      successTitle: (input) => `Created new Local User: ${input.name}`,
    },
  })

  return {
    registerLocalUser,
  }
}
