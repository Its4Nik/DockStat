import { api } from "./api"

/**
 * Example query function for fetching status from the API.
 * Replace this with your actual API queries.
 *
 * @example
 * ```tsx
 * import { useQuery } from "@tanstack/react-query"
 * import { fetchStatus } from "@/lib/queries"
 *
 * function StatusComponent() {
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: ["status"],
 *     queryFn: fetchStatus,
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 */
export async function fetchStatus() {
  const { data, error } = await api.api.v2.status.get()

  if (error) {
    throw new Error(String(error.value))
  }

  return data
}
