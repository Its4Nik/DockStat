import type { ProvidersTable } from "@dockstat/auth/types"
import { extractDockStatError } from "@dockstat/utils"
import { useCallback, useEffect, useState } from "react"
import { api, getAuthHeaders } from "@/lib/api"

export function useProviders() {
  const [providers, setProviders] = useState<ProvidersTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.auth.providers.get({ headers: getAuthHeaders() })
      if (response.status === 200 && response.data) {
        setProviders(response.data)
      } else {
        setError("Failed to load authentication providers")
      }
    } catch (err) {
      const body = extractDockStatError(err)
      if (body?.status === 401) {
        setError("Authentication required")
      } else {
        console.error("Failed to fetch providers:", body ?? err)
        setError(body?.description ?? "Failed to load authentication providers")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  return { error, loading, providers, refetch: fetchProviders }
}
