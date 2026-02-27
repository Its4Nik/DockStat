import { QueryClientProvider as BaseQueryClientProvider, QueryClient } from "@tanstack/react-query"
import { QueryClientContext } from "@/contexts/queryClient"

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  return (
    <QueryClientContext.Provider value={queryClient}>
      <BaseQueryClientProvider client={queryClient}>{children}</BaseQueryClientProvider>
    </QueryClientContext.Provider>
  )
}
