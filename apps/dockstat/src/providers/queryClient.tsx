import { QueryClientProvider as BaseQueryClientProvider, QueryClient } from "@tanstack/react-query"

const queryClient = new QueryClient()

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return <BaseQueryClientProvider client={queryClient}>{children}</BaseQueryClientProvider>
}
