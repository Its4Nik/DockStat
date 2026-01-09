import { extractEdenError } from "@dockstat/utils"
import type { QueryFunctionContext } from "@tanstack/react-query"
import { api } from "../../api"

export async function fetchPluginNavigation({ signal }: QueryFunctionContext) {
  const { data, error } = await api.api.v2.plugins.frontend.navigation.get({ fetch: { signal } })

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
