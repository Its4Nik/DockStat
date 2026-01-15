import { ConfigProvider } from "./addtionalSettings"
import { PageHeadingProvider } from "./pageHeading"
import { QueryClientProvider } from "./queryClient"

export default function DockStatProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <PageHeadingProvider>
        <ConfigProvider>{children}</ConfigProvider>
      </PageHeadingProvider>
    </QueryClientProvider>
  )
}
