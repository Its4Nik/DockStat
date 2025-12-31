import type { QueryFunctionContext } from "@tanstack/react-query"
import { api } from "../api"
import { extractEdenError } from "@dockstat/utils"

export async function fetchNavLinks({ signal }: QueryFunctionContext) {
  const { data, error } = await api.api.v2.db.config.get({ fetch: { signal } })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data.nav_links
}
