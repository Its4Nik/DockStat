import { extractEdenError } from "@dockstat/utils"
import { api } from "../api"
import type { DockerAdapterOptionsSchema } from "@dockstat/typings"

export async function createNewClient(client: {
  clientName: string
  options: typeof DockerAdapterOptionsSchema.static
}) {
  const { data, error } = await api.api.v2.docker.client.register.post(client)

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
