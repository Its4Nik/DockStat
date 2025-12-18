import { Button } from "@dockstat/ui"
import { Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, DeleteClientButtonProps } from "../types"

export function DeleteClientButton({ clientId, clientName, size = "sm" }: DeleteClientButtonProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isDeleting = fetcher.state === "submitting"
  const previousState = useRef(fetcher.state)

  // Handle fetcher response for toast notifications
  useEffect(() => {
    // Only trigger when transitioning from submitting/loading to idle
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Client deleted", {
          description: fetcher.data.message || `Client "${clientName}" has been deleted.`,
          duration: 5000,
        })
      } else {
        toast.error("Failed to delete client", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data, clientName])

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      return
    }

    fetcher.submit(
      {
        intent: "client:delete",
        clientId: clientId.toString(),
      },
      { method: "post" }
    )
  }

  return (
    <Button
      variant="danger"
      size={size}
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-1"
    >
      <Trash2 size={14} />
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  )
}
