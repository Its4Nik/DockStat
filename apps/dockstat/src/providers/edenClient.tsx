import { eden } from "@dockstat/utils/react"
import { EdenClientContext } from "@/contexts/edenClient"
import { toast } from "@/lib/toast"
export function EdenClientProvider({ children }: { children: React.ReactNode }) {
  return <EdenClientContext value={new eden.Client(toast)}>{children}</EdenClientContext>
}
