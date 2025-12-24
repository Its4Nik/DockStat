import { Badge, Button, Card, CardBody, HoverBubble } from "@dockstat/ui"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  Info,
  Package,
  Play,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  User,
} from "lucide-react"
import { useFetcher } from "react-router"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import type { ActionResponse, PluginCardProps, SecurityStatus } from "./types"

const securityIcons: Record<SecurityStatus, React.ReactNode> = {
  safe: <ShieldCheck size={16} className="text-green-500" />,
  unsafe: <ShieldAlert size={16} className="text-red-500" />,
  unknown: <HelpCircle size={16} className="text-yellow-500" />,
  unverified: <ShieldOff size={16} className="text-muted-text" />,
}

const securityBadgeVariants: Record<SecurityStatus, "success" | "error" | "warning" | "secondary"> =
  {
    safe: "success",
    unsafe: "error",
    unknown: "warning",
    unverified: "secondary",
  }

export function PluginCard({
  plugin,
  isLoaded = false,
  verification,
  onActivate,
  onDeactivate,
  onDelete,
  onClick,
}: PluginCardProps) {
  const deleteFetcher = useFetcher<ActionResponse>()
  const activateFetcher = useFetcher<ActionResponse>()
  const previousDeleteState = useRef(deleteFetcher.state)
  const previousActivateState = useRef(activateFetcher.state)

  const isDeleting = deleteFetcher.state === "submitting"
  const isActivating = activateFetcher.state === "submitting"

  // Handle delete response
  useEffect(() => {
    if (
      previousDeleteState.current !== "idle" &&
      deleteFetcher.state === "idle" &&
      deleteFetcher.data
    ) {
      if (deleteFetcher.data.success) {
        toast.success("Plugin deleted", {
          description: deleteFetcher.data.message || `Plugin "${plugin.name}" has been deleted.`,
          duration: 5000,
        })
      } else {
        toast.error("Failed to delete plugin", {
          description: deleteFetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousDeleteState.current = deleteFetcher.state
  }, [deleteFetcher.state, deleteFetcher.data, plugin.name])

  // Handle activate response
  useEffect(() => {
    if (
      previousActivateState.current !== "idle" &&
      activateFetcher.state === "idle" &&
      activateFetcher.data
    ) {
      if (activateFetcher.data.success) {
        toast.success("Plugin activated", {
          description:
            activateFetcher.data.message || `Plugin "${plugin.name}" has been activated.`,
          duration: 5000,
        })
      } else {
        toast.error("Failed to activate plugin", {
          description: activateFetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousActivateState.current = activateFetcher.state
  }, [activateFetcher.state, activateFetcher.data, plugin.name])

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete plugin "${plugin.name}"?`)) {
      return
    }

    if (onDelete) {
      onDelete(plugin.id)
    } else {
      deleteFetcher.submit(
        {
          intent: "plugin:delete",
          pluginId: plugin.id.toString(),
        },
        { method: "post" }
      )
    }
  }

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onActivate) {
      onActivate(plugin.id)
    } else {
      activateFetcher.submit(
        {
          intent: "plugin:activate",
          pluginIds: plugin.id.toString(),
        },
        { method: "post" }
      )
    }
  }

  const handleDeactivate = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDeactivate) {
      onDeactivate(plugin.id)
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick(plugin.id)
    }
  }

  const securityStatus = verification?.securityStatus || "unknown"

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
        className={`w-full hover:border-accent/50 transition-colors ${onClick ? "cursor-pointer" : ""}`}
        onClick={handleClick}
      >
        <CardBody className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Plugin Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="text-accent shrink-0" />
                <h3 className="text-lg font-semibold text-primary-text truncate">{plugin.name}</h3>
                <Badge variant="secondary" size="sm" outlined>
                  v{plugin.version}
                </Badge>
                {isLoaded && (
                  <Badge variant="success" size="sm">
                    <Play size={12} className="mr-1" />
                    Active
                  </Badge>
                )}
                {onClick && (
                  <HoverBubble label="Click to view details" position="top">
                    <Info size={14} className="text-muted-text" />
                  </HoverBubble>
                )}
              </div>

              <p className="text-sm text-muted-text mb-3 line-clamp-2">{plugin.description}</p>

              {/* Author & Repository */}
              <div className="flex items-center gap-4 text-xs text-muted-text mb-3">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{plugin.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" size="sm" outlined>
                    {plugin.repoType}
                  </Badge>
                </div>
                {plugin.repository && plugin.repository !== "Default" && (
                  <a
                    href={plugin.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-accent transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                    <span>Repository</span>
                  </a>
                )}
              </div>

              {/* Tags */}
              {plugin.tags && plugin.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {plugin.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="secondary" size="sm" outlined>
                      {tag}
                    </Badge>
                  ))}
                  {plugin.tags.length > 5 && (
                    <Badge variant="secondary" size="sm" outlined>
                      +{plugin.tags.length - 5}
                    </Badge>
                  )}
                </div>
              )}

              {/* Verification Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {securityIcons[securityStatus]}
                  <Badge variant={securityBadgeVariants[securityStatus]} size="sm">
                    {securityStatus === "safe"
                      ? "Verified Safe"
                      : securityStatus === "unsafe"
                        ? "Unsafe"
                        : securityStatus === "unverified"
                          ? "Unverified"
                          : "Unknown"}
                  </Badge>
                </div>
                {verification?.repository && (
                  <span className="text-xs text-muted-text">from {verification.repository}</span>
                )}
                {verification?.policy && (
                  <Badge
                    variant={verification.policy === "strict" ? "warning" : "secondary"}
                    size="sm"
                    outlined
                  >
                    {verification.policy}
                  </Badge>
                )}
                {verification?.message && securityStatus === "unsafe" && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle size={12} />
                    <span>{verification.message}</span>
                  </div>
                )}
                {!verification?.matchesCache && verification?.cachedHash && (
                  <HoverBubble
                    label={`Expected hash: ${verification.cachedHash.slice(0, 16)}...`}
                    position="top"
                  >
                    <div className="flex items-center gap-1 text-xs text-yellow-500 cursor-help">
                      <AlertTriangle size={12} />
                      <span>Hash mismatch</span>
                    </div>
                  </HoverBubble>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {!isLoaded ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="flex items-center gap-1.5"
                >
                  <Play size={14} />
                  {isActivating ? "Activating..." : "Activate"}
                </Button>
              ) : (
                <HoverBubble label="Deactivation not yet implemented" position="left">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDeactivate}
                    disabled
                    className="flex items-center gap-1.5"
                  >
                    <Shield size={14} />
                    Active
                  </Button>
                </HoverBubble>
              )}
              <HoverBubble
                label={isLoaded ? "Cannot delete active plugin" : "Delete plugin"}
                position="left"
              >
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || isLoaded}
                  className="flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </HoverBubble>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}
