import { QueryClientProvider as BaseQueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/contexts/queryClient"

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return <BaseQueryClientProvider client={queryClient}>{children}</BaseQueryClientProvider>
}
