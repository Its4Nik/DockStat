import type { TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"

type ApiClient = ReturnType<typeof treaty<TreatyType>>["api"]["v2"]

/**
 * Type-safe API client using Eden Treaty.
 * Provides end-to-end type safety between frontend and backend.
 *
 * Used only for typed route references passed to the Eden Client class
 * (e.g. `api.themes.get`). All actual requests go through the Client
 * context which injects auth headers and handles 401s.
 *
 * Configured with:
 * - Base URL from DOCKSTAT_API_PORT environment variable
 * - Credentials included for cookie-based authentication
 */
export const api: ApiClient = treaty<TreatyType>(
  import.meta.env.DOCKSTAT_API_PORT || `http://localhost:3030`,
  {
    fetch: {
      credentials: "include",
    },
  }
).api.v2
