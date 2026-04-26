import { useContext } from "react"
import { EdenClientContext } from "@/contexts/edenClient"
import { api } from "@/lib/api"

/**
 * Safely parse a date value from the API into a JavaScript Date.
 * Handles ISO 8601 strings, Unix timestamps (seconds), and already-parsed Date objects.
 */
export function parseApiDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null

  // Already a Date (e.g. from a transformer)
  if (value instanceof Date) return value

  // ISO 8601 string from serialized backend response
  if (typeof value === "string") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  // Unix timestamp in seconds — multiply by 1000 for JS milliseconds
  if (typeof value === "number") {
    return new Date(value * 1000)
  }

  return null
}

// API response types (match Eden-inferred types from backend)
interface User {
  createdAt: Date
  id: string
  name: string
  updatedAt: Date
}

interface Provider {
  client_id: string
  created_at: Date
  icon: string | null
  id: string
  issuer_url: string
  name: string | null
  scopes: string
}

interface ApiKey {
  createdAt: Date
  expiresAt: Date | null
  id: string
  lastUsedAt: Date | null
  name: string
  revokedAt: Date | null
  scopes: string
}

// Wrapped response types
interface UsersQueryData {
  users: User[]
}

interface ApiKeysQueryData {
  keys: ApiKey[]
}

type ApiKeysQueryResult = {
  data: ApiKeysQueryData | undefined
  isLoading: boolean
  refetch: () => void
}

// Hook return types
type AccountsQueriesReturn = {
  fetchApiKeys: (userId?: string) => ApiKeysQueryResult
  providers: Provider[]
  providersLoading: boolean
  refetchProviders: () => void
  refetchUsers: () => void
  users: User[]
  usersLoading: boolean
}

type ApiKeysQueryReturn = {
  apiKeys: ApiKey[]
  isLoading: boolean
  refetch: () => void
}

export const useAccountsQueries = (): AccountsQueriesReturn => {
  const eden = useContext(EdenClientContext)

  // Fetch all users
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = eden.query({
    queryKey: ["fetchUsers"],
    route: api.auth.users.get,
  })

  // Fetch all providers
  const {
    data: providersData,
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = eden.query({
    queryKey: ["fetchProviders"],
    route: api.auth.providers.get,
  })

  // Fetch all API keys (optionally filtered by userId)
  const fetchApiKeys = (userId?: string): ApiKeysQueryResult => {
    return eden.query({
      queryKey: ["fetchApiKeys", userId],
      route: api.auth["api-keys"].get,
    })
  }

  return {
    fetchApiKeys,
    providers: (providersData as Provider[]) || [],
    providersLoading,
    refetchProviders,
    refetchUsers,
    users: (usersData as UsersQueryData)?.users || [],
    usersLoading,
  }
}

// Hook to fetch API keys for a specific user
export const useApiKeysQuery = (userId?: string): ApiKeysQueryReturn => {
  const eden = useContext(EdenClientContext)

  const { data, isLoading, refetch } = eden.query({
    queryKey: ["fetchApiKeys", userId],
    route: api.auth["api-keys"].get,
  })

  return {
    apiKeys: (data as ApiKeysQueryData)?.keys || [],
    isLoading,
    refetch,
  }
}
