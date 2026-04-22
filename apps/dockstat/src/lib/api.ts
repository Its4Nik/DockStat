import type { TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token")
  console.log(`Found auth token: ${token}`)
  return token ? { authorization: `Bearer ${token}` } : {}
}

/**
 * Type-safe API client using Eden Treaty.
 * Provides end-to-end type safety between frontend and backend.
 *
 * Configured with:
 * - Base URL from DOCKSTAT_API_PORT environment variable
 * - Credentials included for cookie-based authentication
 * - Dynamic authorization header with JWT token from localStorage
 */
export const api = treaty<TreatyType>(
  import.meta.env.DOCKSTAT_API_PORT || `http://localhost:3030`,
  {
    fetch: {
      credentials: "include",
    },
    headers: getHeaders(),
  }
).api.v2
