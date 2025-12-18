import { Toggle } from "@dockstat/ui"
import { useEffect, useRef } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, MonitoringToggleProps } from "../types"

export function MonitoringToggle({ clientId, isMonitoring }: MonitoringToggleProps) {
  const fetcher = useFetcher<ActionResponse>()
  const previousState = useRef(fetcher.state)

  // Check if we're in the middle of a toggle operation
  const isPending = fetcher.state === "submitting" || fetcher.state === "loading"

  // Optimistic UI: if we're pending and the intent was toggle, show opposite state
  const isToggling = isPending && fetcher.formData?.get("intent") === "client:monitoring:toggle"

  const displayMonitoring = isToggling ? !isMonitoring : isMonitoring

  // Handle fetcher response for toast notifications
  useEffect(() => {
    // Only trigger when transitioning from submitting/loading to idle
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Monitoring updated", {
          description:
            fetcher.data.message || `Monitoring has been ${isMonitoring ? "disabled" : "enabled"}.`,
          duration: 3000,
        })
      } else {
        toast.error("Failed to toggle monitoring", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data, isMonitoring])

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
