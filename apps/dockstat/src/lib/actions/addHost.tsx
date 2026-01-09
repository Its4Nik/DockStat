import { extractEdenError } from "@dockstat/utils"
import { api } from "../api"

export async function addHost(host: {
  secure: boolean
  name: string
  hostname: string
  clientId: number
  port: number
}) {
  const { data, error } = await api.api.v2.docker.hosts.add.post(host)

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
