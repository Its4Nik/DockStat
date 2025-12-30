import type { TreatyType } from "@dockstat/api"
import { type Treaty, treaty } from "@elysiajs/eden"

/**
 * Type-safe API client using Eden Treaty.
 * Provides end-to-end type safety between frontend and backend.
 *
 * Configured with:
 * - Base URL from VITE_API_URL environment variable
 * - Credentials included for cookie-based authentication (will maybe added in the future)
 */
export const api: Treaty.Create<TreatyType> = treaty<TreatyType>(
  import.meta.env.VITE_API_URL || `http://localhost:3030`,
  {
    fetch: {
      credentials: "include",
    },
  }
)
