import type { QueryFunctionContext } from "@tanstack/react-query"
import { api } from "../api"

export async function FetchBackendStatus({ signal }: QueryFunctionContext) {
  const { data, error } = await api.api.v2.status.get({ fetch: { signal } })

  if (error) {
    throw new Error(String(error.value))
  }

  return data
}
