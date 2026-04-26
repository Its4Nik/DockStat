import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

export const useCreateUserMutations = () => {
  const eden = useContext(EdenClientContext)

  const registerLocalUser = eden.mutate({
    mutationKey: ["registerLocalUser"],
    route: api.auth.local.register.post,
    toast: {
      errorTitle: (input) => `Error while registering local user ${input.name}`,
      successDescription: () => "",
      successTitle: (input) => `Created new Local User: ${input.name}`,
    },
  })

  return {
    registerLocalUser,
  }
}
