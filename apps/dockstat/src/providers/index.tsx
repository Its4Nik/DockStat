import { ConfigProvider } from "./addtionalSettings"
import { PageHeadingProvider } from "./pageHeading"
import { QueryClientProvider } from "./queryClient"
import { ThemeProvider } from "./theme"

export default function DockStatProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <ThemeProvider>
        <PageHeadingProvider>
          <ConfigProvider>{children}</ConfigProvider>
        </PageHeadingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
