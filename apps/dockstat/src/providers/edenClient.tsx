import { eden } from "@dockstat/utils/react"
import { toast } from "@/lib/toast"

const client = new eden.Client(toast)

export function EdenClientProvider({ children }: { children: React.ReactNode }) {
  return <eden.EdenProvider client={client}>{children}</eden.EdenProvider>
}
