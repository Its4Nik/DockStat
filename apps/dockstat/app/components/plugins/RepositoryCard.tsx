import { Badge, Button, Card, CardBody, HoverBubble } from "@dockstat/ui"
import { motion } from "framer-motion"
import {
  CheckCircle,
  ExternalLink,
  Package,
  Pencil,
  Power,
  PowerOff,
  RefreshCw,
  Shield,
  ShieldOff,
  Store,
  Trash2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import { EditRepositoryForm } from "./forms"
import type { ActionResponse, RepositoryCardProps } from "./types"

export function RepositoryCard({
  repository,
  onSync,
  onDelete,
  onToggle,
  onEdit,
  pluginCount = 0,
}: RepositoryCardProps) {
  const syncFetcher = useFetcher<ActionResponse>()
  const deleteFetcher = useFetcher<ActionResponse>()
  const toggleFetcher = useFetcher<ActionResponse>()

  const [isEditing, setIsEditing] = useState(false)

  const previousSyncState = useRef(syncFetcher.state)
  const previousDeleteState = useRef(deleteFetcher.state)
  const previousToggleState = useRef(toggleFetcher.state)

  const isSyncing = syncFetcher.state === "submitting"
  const isDeleting = deleteFetcher.state === "submitting"
  const isToggling = toggleFetcher.state === "submitting"

  // Handle sync response
  useEffect(() => {
    if (previousSyncState.current !== "idle" && syncFetcher.state === "idle" && syncFetcher.data) {
      if (syncFetcher.data.success) {
        toast.success("Repository synced", {
          description:
            syncFetcher.data.message || `Repository "${repository.name}" has been synced.`,
          duration: 5000,
        })
      } else {
        toast.error("Failed to sync repository", {
          description: syncFetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousSyncState.current = syncFetcher.state
  }, [syncFetcher.state, syncFetcher.data, repository.name])

  // Handle delete response
  useEffect(() => {
    if (
      previousDeleteState.current !== "idle" &&
      deleteFetcher.state === "idle" &&
      deleteFetcher.data
    ) {
      if (deleteFetcher.data.success) {
        toast.success("Repository deleted", {
          description:
            deleteFetcher.data.message || `Repository "${repository.name}" has been deleted.`,
          duration: 5000,
        })
      } else {
        toast.error("Failed to delete repository", {
          description: deleteFetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousDeleteState.current = deleteFetcher.state
  }, [deleteFetcher.state, deleteFetcher.data, repository.name])

  // Handle toggle response
  useEffect(() => {
    if (
      previousToggleState.current !== "idle" &&
      toggleFetcher.state === "idle" &&
      toggleFetcher.data
    ) {
      if (toggleFetcher.data.success) {
        toast.success("Repository updated", {
          description: toggleFetcher.data.message || `Repository status updated.`,
          duration: 3000,
        })
      } else {
        toast.error("Failed to update repository", {
          description: toggleFetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousToggleState.current = toggleFetcher.state
  }, [toggleFetcher.state, toggleFetcher.data])

  const handleSync = () => {
    if (onSync) {
      onSync(repository.id)
    } else {
      syncFetcher.submit(
        {
          intent: "repository:sync",
          repoId: repository.id.toString(),
        },
        { method: "post" }
      )
    }
  }

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete repository "${repository.name}"?`)) {
      return
    }

    if (onDelete) {
      onDelete(repository.id)
    } else {
      deleteFetcher.submit(
        {
          intent: "repository:delete",
          repoId: repository.id.toString(),
        },
        { method: "post" }
      )
    }
  }

  const handleToggle = () => {
    if (onToggle) {
      onToggle(repository.id)
    } else {
      toggleFetcher.submit(
        {
          intent: "repository:toggle",
          repoId: repository.id.toString(),
        },
        { method: "post" }
      )
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(repository.id)
    } else {
      setIsEditing(true)
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const hasVerificationApi = !!repository.verification_api

  // Show edit form if editing
  if (isEditing) {
    return (
      <EditRepositoryForm
        repository={repository}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="outlined"
        size="sm"
        className={`w-full transition-colors ${
          repository.isVerified ? "hover:border-accent/50" : "hover:border-muted-text/30"
        }`}
      >
        <CardBody className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Repository Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Store size={18} className="text-accent shrink-0" />
                <h3 className="text-lg font-semibold text-primary-text truncate">
                  {repository.name}
                </h3>
                <Badge variant="secondary" size="sm" outlined>
                  {repository.type}
                </Badge>
                {repository.isVerified ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle size={12} className="mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm" outlined>
                    <ShieldOff size={12} className="mr-1" />
                    Unverified
                  </Badge>
                )}
                <Badge
                  variant={repository.policy === "strict" ? "warning" : "secondary"}
                  size="sm"
                  outlined
                >
                  <Shield size={12} className="mr-1" />
                  {repository.policy}
                </Badge>
              </div>

              {/* Source */}
              <div className="flex items-center gap-1 text-sm text-muted-text mb-3">
                <span className="truncate max-w-md">{repository.source}</span>
                {repository.verification_api && (
                  <a
                    href={repository.verification_api}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 ml-2 hover:text-accent transition-colors"
                  >
                    <ExternalLink size={14} className="shrink-0" />
                    <span className="text-xs">Verification API</span>
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Package size={14} className="text-muted-text" />
                  <span className="text-secondary-text">{pluginCount} installed</span>
                </div>
                {hasVerificationApi ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-secondary-text">Real-time verification enabled</span>
                  </div>
                ) : repository.policy === "strict" ? (
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    <ShieldOff size={14} />
                    <span>No verification API configured</span>
                  </div>
                ) : null}
              </div>

              {/* Policy info */}
              <div className="mt-2 text-xs text-muted-text">
                {repository.policy === "strict" ? (
                  <span>Plugins from this repository are verified on every activation</span>
                ) : (
                  <span>Plugins from this repository are trusted without verification</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <HoverBubble label="Sync plugins from repository" position="left">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync"}
                </Button>
              </HoverBubble>
              <HoverBubble label="Edit repository settings" position="left">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center gap-1.5"
                >
                  <Pencil size={14} />
                  Edit
                </Button>
              </HoverBubble>
              <Button
                variant={repository.isVerified ? "secondary" : "primary"}
                size="sm"
                onClick={handleToggle}
                disabled={isToggling}
                className="flex items-center gap-1.5"
              >
                {repository.isVerified ? (
                  <>
                    <PowerOff size={14} />
                    {isToggling ? "..." : "Unverify"}
                  </>
                ) : (
                  <>
                    <Power size={14} />
                    {isToggling ? "..." : "Verify"}
                  </>
                )}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}
