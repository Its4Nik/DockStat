import { Button } from "@dockstat/ui"
import { Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse } from "../types"

export function DeleteHostButton({ clientId, hostId }: { clientId: number; hostId: number }) {
  const fetcher = useFetcher<ActionResponse>()
  const isDeleting = fetcher.state === "submitting"
  const previousState = useRef(fetcher.state)

  useEffect(() => {
    // Only trigger when transitioning from submitting/loading to idle
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Host deleted", {
          description: fetcher.data.message || `Host "${hostId}" has been deleted.`,
          duration: 5000,
        })
      } else {
        toast.error("Failed to delete host", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data, hostId])

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete host "${hostId}"?`)) {
      return
    }

    fetcher.submit(
      {
        intent: "host:delete",
        clientId: clientId.toString(),
        hostId: hostId.toString(),
      },
      { method: "post" }
    )
  }

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-1"
    >
      <Trash2 size={14} />
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  )
}
