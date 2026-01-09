import type { PoolMetrics } from "@dockstat/docker-client/types"
import { extractEdenError } from "@dockstat/utils"
import type { QueryFunctionContext } from "@tanstack/react-query"
import { api } from "../api"

export async function fetchPoolStatus({ signal }: QueryFunctionContext): Promise<PoolMetrics> {
  const { data, error } = await api.api.v2.docker.manager["pool-stats"].get({ fetch: { signal } })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
