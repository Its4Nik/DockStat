import { useQuery } from "@tanstack/react-query"
import { AdditionalSettingsContext } from "@/contexts/additionalSettings"
import { fetchAdditionalSettings } from "@Queries"

export function AdditionalSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryFn: fetchAdditionalSettings,
    queryKey: ["fetchAdditionalContext"],
  })

  return <AdditionalSettingsContext value={data || {}}>{children}</AdditionalSettingsContext>
}
