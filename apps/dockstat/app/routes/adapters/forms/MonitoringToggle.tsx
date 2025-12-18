import { Toggle } from "@dockstat/ui"
import { useFetcher } from "react-router"

interface MonitoringToggleProps {
  clientId: number
  isMonitoring: boolean
}

export function MonitoringToggle({ clientId, isMonitoring }: MonitoringToggleProps) {
  const fetcher = useFetcher()

  // Check if we're in the middle of a toggle operation
  const isPending = fetcher.state === "submitting" || fetcher.state === "loading"

  // Optimistic UI: if we're pending and the intent was toggle, show opposite state
  const isToggling = isPending && fetcher.formData?.get("intent") === "client:monitoring:toggle"

  const displayMonitoring = isToggling ? !isMonitoring : isMonitoring

  const handleToggle = () => {
    fetcher.submit(
      {
        intent: "client:monitoring:toggle",
        clientId: clientId.toString(),
      },
      { method: "post" }
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Toggle checked={displayMonitoring} onChange={handleToggle} disabled={isPending} size="sm" />
      <span className="text-xs text-muted-text">
        {isPending ? "Updating..." : displayMonitoring ? "Monitoring" : "Idle"}
      </span>
    </div>
  )
}
