import { AdditionalSettingsProvider } from "./addtionalSettings"
import { PageHeadingProvider } from "./pageHeading"
import { QueryClientProvider } from "./queryClient"

export default function DockStatProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <PageHeadingProvider>
        <AdditionalSettingsProvider>{children}</AdditionalSettingsProvider>
      </PageHeadingProvider>
    </QueryClientProvider>
  )
}
