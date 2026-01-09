import { extractEdenError } from "@dockstat/utils"
import type { QueryFunctionContext } from "@tanstack/react-query"
import { api } from "../../api"

export async function fetchPluginTemplate(
  { signal }: { signal: QueryFunctionContext["signal"] },
  pluginId: number,
  path: string
) {
  const { data, error } = await api.api.v2.plugins.frontend({ pluginId: pluginId }).template.post(
    {
      path,
    },
    { fetch: { signal } }
  )

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
