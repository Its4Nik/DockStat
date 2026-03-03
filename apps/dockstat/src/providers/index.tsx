import { ConfigProvider } from "./additionalSettings"
import { PageHeadingProvider } from "./pageHeading"
import { QueryClientProvider } from "./queryClient"
import { ThemeProvider } from "./theme"
import { ThemeSidebarProvider } from "./themeSidebar"

export default function DockStatProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <ThemeProvider>
        <ThemeSidebarProvider>
          <PageHeadingProvider>
            <ConfigProvider>{children}</ConfigProvider>
          </PageHeadingProvider>
        </ThemeSidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
