import { extractEdenError } from "@dockstat/utils"
import type { QueryFunctionContext } from "@tanstack/react-query"
import { api } from "../api"

export async function fetchProcessRSS({ signal }: QueryFunctionContext) {
  const { data, error } = await api.api.v2.misc.stats.get({ fetch: { signal } })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data.process.memory.rss
}
