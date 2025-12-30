import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * TanStack Query client instance.
 * Manages server state, caching, and synchronization.
 */
const queryClient = new QueryClient()

/**
 * Root application component.
 * Provides QueryClient context for the entire app.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <h1>DockStat</h1>
      </div>
    </QueryClientProvider>
  )
}

export default App
