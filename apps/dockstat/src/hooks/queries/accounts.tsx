import { extractDockStatError } from "@dockstat/utils"
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
  apiKeys: ApiKey[]
  error: QueryError
  isLoading: boolean
  refetch: () => void
}

// Hook return types
type QueryError = {
  body: ReturnType<typeof extractDockStatError>
  message: string
} | null

type AccountsQueriesReturn = {
  fetchApiKeys: (userId?: string) => ApiKeysQueryResult
  providers: Provider[]
  providersError: QueryError
  providersLoading: boolean
  refetchProviders: () => void
  refetchUsers: () => void
  users: User[]
  usersError: QueryError
  usersLoading: boolean
}

type ApiKeysQueryReturn = {
  apiKeys: ApiKey[]
  error: QueryError
  isLoading: boolean
  refetch: () => void
}

export const useAccountsQueries = (): AccountsQueriesReturn => {
  const eden = useContext(EdenClientContext)

  // Fetch all users
  const {
    data: usersData,
    error: usersQueryError,
    isError: usersIsError,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = eden.query({
    queryKey: ["fetchUsers"],
    route: api.auth.users.get,
  })

  // Fetch all providers
  const {
    data: providersData,
    error: providersQueryError,
    isError: providersIsError,
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = eden.query({
    queryKey: ["fetchProviders"],
    route: api.auth.providers.get,
  })

  const usersError: QueryError = usersIsError
    ? {
        body: extractDockStatError(usersQueryError),
        message: usersQueryError?.message ?? "Failed to load users",
      }
    : null

  const providersError: QueryError = providersIsError
    ? {
        body: extractDockStatError(providersQueryError),
        message: providersQueryError?.message ?? "Failed to load providers",
      }
    : null

  // Fetch all API keys (optionally filtered by userId)
  const fetchApiKeys = (userId?: string): ApiKeysQueryResult => {
    const {
      data,
      error: keysQueryError,
      isError: keysIsError,
      isLoading,
      refetch,
    } = eden.query({
      queryKey: ["fetchApiKeys", userId],
      route: api.auth["api-keys"].get,
    })

    const keysError: QueryError = keysIsError
      ? {
          body: extractDockStatError(keysQueryError),
          message: keysQueryError?.message ?? "Failed to load API keys",
        }
      : null

    return {
      apiKeys: (data as ApiKeysQueryData)?.keys || [],
      error: keysError,
      isLoading,
      refetch,
    }
  }

  return {
    fetchApiKeys,
    providers: (providersData as Provider[]) || [],
    providersError,
    providersLoading,
    refetchProviders,
    refetchUsers,
    users: (usersData as UsersQueryData)?.users || [],
    usersError,
    usersLoading,
  }
}

// Hook to fetch API keys for a specific user
export const useApiKeysQuery = (userId?: string): ApiKeysQueryReturn => {
  const eden = useContext(EdenClientContext)

  const {
    data,
    error: keysQueryError,
    isError,
    isLoading,
    refetch,
  } = eden.query({
    queryKey: ["fetchApiKeys", userId],
    route: api.auth["api-keys"].get,
  })

  const keysError: QueryError = isError
    ? {
        body: extractDockStatError(keysQueryError),
        message: keysQueryError?.message ?? "Failed to load API keys",
      }
    : null

  return {
    apiKeys: (data as ApiKeysQueryData)?.keys || [],
    error: keysError,
    isLoading,
    refetch,
  }
}
