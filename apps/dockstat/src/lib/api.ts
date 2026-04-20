import type { TreatyType } from "@dockstat/api"
import { treaty } from "@elysiajs/eden"

/**
 * Type-safe API client using Eden Treaty.
 * Provides end-to-end type safety between frontend and backend.
 *
 * Configured with:
 * - Base URL from DOCKSTAT_API_PORT environment variable
 * - Credentials included for cookie-based authentication (will maybe added in the future)
 */
export const api = treaty<TreatyType>(
  import.meta.env.DOCKSTAT_API_PORT || `http://localhost:3030`,
  {
    fetch: {
      credentials: "include",
    },
  }
).api.v2
