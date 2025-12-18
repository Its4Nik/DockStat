import { Button } from "@dockstat/ui"
import { Trash2 } from "lucide-react"
import { useFetcher } from "react-router"

interface DeleteClientButtonProps {
  clientId: number
  clientName: string
  size?: "sm" | "md" | "lg"
}

export function DeleteClientButton({ clientId, clientName, size = "sm" }: DeleteClientButtonProps) {
  const fetcher = useFetcher()
  const isDeleting = fetcher.state === "submitting"

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
