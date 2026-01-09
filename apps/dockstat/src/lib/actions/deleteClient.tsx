import { extractEdenError } from "@dockstat/utils"
import { api } from "../api"

export async function deleteClient(clientId: number) {
  const { data, error } = await api.api.v2.docker.client.delete.delete({ clientId: clientId })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
