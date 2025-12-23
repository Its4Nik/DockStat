import { Button } from "@dockstat/ui"
import { Activity } from "lucide-react"
import { useEffect, useRef } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse } from "../types"

export interface CreateMonitoringManagerButtonProps {
  clientId: number
  size?: "sm" | "md" | "lg"
}

export function CreateMonitoringManagerButton({
  clientId,
  size = "sm",
}: CreateMonitoringManagerButtonProps) {
  const fetcher = useFetcher<ActionResponse>()
  const previousState = useRef(fetcher.state)

  const isPending = fetcher.state === "submitting" || fetcher.state === "loading"

  // Handle fetcher response for toast notifications
  useEffect(() => {
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Monitoring manager created", {
          description: fetcher.data.message || "You can now enable monitoring for this client.",
          duration: 3000,
        })
      } else {
        toast.error("Failed to create monitoring manager", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data])

  const handleCreate = () => {
    fetcher.submit(
      {
        intent: "client:monitoring:create-manager",
        clientId: clientId.toString(),
      },
      { method: "post" }
    )
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleCreate}
      disabled={isPending}
      className="flex items-center gap-1.5"
    >
      <Activity size={14} className="mr-2" />
      <span>{isPending ? "Creating..." : "Create Monitoring Manager"}</span>
    </Button>
  )
}
