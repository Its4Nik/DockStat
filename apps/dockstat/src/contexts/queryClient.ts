import { QueryClient } from "@tanstack/react-query"
import { createContext } from "react"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnReconnect: true,
      // Don't refetch on window focus, mount, or reconnect - only when explicitly invalidated
      refetchOnWindowFocus: false,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Data remains fresh for 5 minutes - won't refetch unless explicitly invalidated
      staleTime: 5 * 60 * 1000,
    },
  },
})

export const QueryClientContext = createContext<QueryClient>(queryClient)
