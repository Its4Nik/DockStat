import { extractEdenError } from "@dockstat/utils"
import type { EdenData, EdenQueryRoute } from "./types"

export function createEdenQueryFn<TRoute extends EdenQueryRoute>(route: TRoute) {
  type TData = NonNullable<EdenData<TRoute>>

  return async ({ signal }: { signal?: AbortSignal }) => {
    const { data, error } = await route({ fetch: { signal } })

    if (error) {
      throw new Error(extractEdenError({ error }))
    }

    return data as TData
  }
}
