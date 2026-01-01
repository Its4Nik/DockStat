import { AdditionalSettingsProvider } from "./addtionalSettings"
import { QueryClientProvider } from "./queryClient"

export default function DockStatProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <AdditionalSettingsProvider>{children}</AdditionalSettingsProvider>
    </QueryClientProvider>
  )
}
